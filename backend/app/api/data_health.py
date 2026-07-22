import json
import logging
import uuid
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.uploads import get_current_user
from app.db.models import Upload, User
from app.db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("")
def get_data_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the data health score and detailed exclusion reasons 
    for the most recent ready upload.
    """
    upload = (
        db.query(Upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Upload.uploaded_at.desc())
        .first()
    )
    
    if not upload or upload.status != "ready":
        raise HTTPException(status_code=404, detail="No ready upload found.")

    # Parse metadata stored as JSON in error_message field
    meta: dict = {}
    try:
        if upload.error_message and upload.error_message.startswith("{"):
            meta = json.loads(upload.error_message)
    except Exception:
        pass

    exclusion_reasons = meta.get("exclusion_reasons", {})
    total_excluded = upload.row_count_excluded or sum(exclusion_reasons.values())
    total_rows = upload.row_count_raw or 0
    total_processed = upload.row_count_processed or 0
    
    score = 100.0
    if total_rows > 0:
        score = (total_processed / total_rows) * 100.0

    return {
        "uploadId": str(upload.id),
        "healthScore": round(score, 1),
        "totalRows": total_rows,
        "processedRows": total_processed,
        "excludedRows": total_excluded,
        "exclusionReasons": [
            {"reason": k, "count": v}
            for k, v in exclusion_reasons.items()
            if v > 0
        ]
    }
