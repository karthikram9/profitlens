import logging
import uuid
import json
from typing import Dict, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import BusinessAssumptions, Order, Upload
from app.services.data_processing_service import process_dataframe
from app.services.risk_scoring_service import apply_risk_scores

logger = logging.getLogger(__name__)


def get_or_create_assumptions(db: Session, user_id: str) -> BusinessAssumptions:
    """Fetch user business assumptions or create default record if missing."""
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    assumptions = db.query(BusinessAssumptions).filter(BusinessAssumptions.user_id == uid).first()
    if not assumptions:
        assumptions = BusinessAssumptions(user_id=uid)
        db.add(assumptions)
        db.commit()
        db.refresh(assumptions)
    return assumptions


def update_assumptions(db: Session, user_id: str, updates: Dict[str, Any]) -> BusinessAssumptions:
    """Update user business assumptions."""
    assumptions = get_or_create_assumptions(db, user_id)
    for field, val in updates.items():
        if hasattr(assumptions, field) and val is not None:
            setattr(assumptions, field, val)
    db.commit()
    db.refresh(assumptions)
    return assumptions


def recompute_user_upload(db: Session, user_id: str, upload_id: str) -> Dict[str, Any]:
    """
    Recomputes financial metrics and return risk scores for an existing ready upload
    using the user's latest saved business assumptions.
    """
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    up_id = uuid.UUID(upload_id) if isinstance(upload_id, str) else upload_id

    upload = db.query(Upload).filter(Upload.id == up_id, Upload.user_id == uid).first()
    if not upload or upload.status != "ready":
        raise ValueError("Upload not found or not in ready state.")

    # Get current user assumptions
    assumptions = get_or_create_assumptions(db, user_id)

    # Fetch existing orders to rebuild input dataframe
    orders = db.query(Order).filter(Order.upload_id == up_id, Order.user_id == uid).all()
    if not orders:
        raise ValueError("No orders found for this upload to recompute.")

    # Convert existing orders into DataFrame for processing pipeline
    raw_data = []
    for o in orders:
        raw_data.append({
            "order_id": o.order_id,
            "date": o.date,
            "status": o.status,
            "fulfilment": o.fulfilment,
            "ship_service_level": o.ship_service_level,
            "category": o.category,
            "sku": o.sku,
            "qty": o.qty,
            "amount": o.amount,
            "ship_state": o.ship_state,
            "ship_city": o.ship_city,
            "b2b": o.b2b,
        })
    df_raw = pd.DataFrame(raw_data)

    # Set upload status to processing
    upload.status = "processing"
    db.commit()

    try:
        # Re-run data processing with updated assumptions
        processing_result = process_dataframe(
            df=df_raw,
            upload_id=str(up_id),
            user_id=str(uid),
            assumptions=assumptions,
        )

        rows = processing_result["rows"]

        # Re-run risk scoring
        rows = apply_risk_scores(rows)

        # Atomic transaction: delete previous orders and insert recomputed rows
        with db.begin_nested():
            db.query(Order).filter(Order.user_id == uid).delete(synchronize_session=False)

            if rows:
                db.bulk_insert_mappings(Order, rows)

            upload.status = "ready"
            upload.row_count_raw = processing_result["row_count_raw"]
            upload.row_count_processed = processing_result["row_count_processed"]
            upload.row_count_excluded = processing_result["row_count_excluded"]
            upload.error_message = json.dumps({
                "exclusion_reasons": processing_result["exclusion_reasons"],
                "categories_found": processing_result["categories_found"],
                "date_min": processing_result["date_min"],
                "date_max": processing_result["date_max"],
            })

        db.commit()
        logger.info("recompute_completed upload_id=%s rows=%d", upload_id, len(rows))
        return {
            "uploadId": str(up_id),
            "status": "ready",
            "rowCountProcessed": len(rows),
        }

    except Exception as exc:
        logger.error("recompute_failed upload_id=%s err=%s", upload_id, exc, exc_info=True)
        upload.status = "failed"
        upload.error_message = str(exc)
        db.commit()
        raise exc
