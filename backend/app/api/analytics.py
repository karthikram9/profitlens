from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.uploads import get_current_user
from app.db.models import User, Upload
from app.models.analytics import OverviewResponse, ProfitOverviewResponse, ProductsResponse
from app.services.analytics_service import (
    get_dashboard_overview,
    get_profit_overview,
    get_products_paginated,
)
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_ready_upload(db: Session, user: User) -> Upload:
    """Shared helper: fetch the user's most recent ready upload, or raise 404."""
    upload = (
        db.query(Upload)
        .filter(Upload.user_id == user.id)
        .order_by(Upload.uploaded_at.desc())
        .first()
    )
    if not upload or upload.status != "ready":
        raise HTTPException(status_code=404, detail="No ready upload found for this user.")
    return upload


# ── Module 5 ─────────────────────────────────────────────────────────────────

@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload = _get_ready_upload(db, current_user)
    try:
        return get_dashboard_overview(db, str(upload.id))
    except Exception as e:
        logger.error(f"Error generating overview for upload {upload.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate dashboard overview.")


# ── Module 6 ─────────────────────────────────────────────────────────────────

@router.get("/profit-overview", response_model=ProfitOverviewResponse)
def get_profit_overview_endpoint(
    category: Optional[str] = Query(default=None, description="Filter monthly trend by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns category-level profit, cost breakdown, monthly trend, and inventory
    opportunity candidates. The optional ?category= param filters ONLY the
    monthlyTrend portion — all other sections are always full-dataset.
    """
    upload = _get_ready_upload(db, current_user)
    try:
        return get_profit_overview(db, str(upload.id), category=category)
    except Exception as e:
        logger.error(f"Error generating profit overview for upload {upload.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate profit overview.")


@router.get("/products", response_model=ProductsResponse)
def get_products_endpoint(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    sortBy: str = Query(default="profit", pattern="^(revenue|profit|marginPercent|unitsSold)$"),
    sortOrder: str = Query(default="desc", pattern="^(asc|desc)$"),
    search: Optional[str] = Query(default=None, max_length=100),
    category: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    SKU-level paginated product analytics.
    All pagination, sorting, and search happen at the SQL layer — never in-memory.
    Separate from /profit-overview intentionally: product count can be large.
    """
    upload = _get_ready_upload(db, current_user)
    try:
        return get_products_paginated(
            db=db,
            upload_id=str(upload.id),
            page=page,
            page_size=pageSize,
            sort_by=sortBy,
            sort_order=sortOrder,
            search=search,
            category=category,
        )
    except Exception as e:
        logger.error(f"Error generating products for upload {upload.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate products data.")
