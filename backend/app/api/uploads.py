"""
/uploads/* API router — Module 4 Upload & Schema Detection.

Endpoints:
  POST   /uploads                          — upload CSV, validate, stage, detect schema
  POST   /uploads/{uploadId}/confirm-mapping — confirm mapping, run full pipeline (atomic)
  GET    /uploads/{uploadId}/status        — poll processing status
  GET    /uploads/{uploadId}/summary       — full receipt once status=ready
  GET    /uploads/current                  — most recent upload for authenticated user
"""

import io
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.models import Order, Upload, User
from app.db.session import get_db
from app.models.upload import (
    ConfirmMappingRequest,
    CurrentUploadResponse,
    ExclusionReason,
    UploadInitResponse,
    UploadStatusResponse,
    UploadSummaryResponse,
)
from app.services.data_processing_service import process_dataframe
from app.services.risk_scoring_service import apply_risk_scores
from app.services.schema_detection_service import detect_schema
from app.services.schema_registry import REQUIRED_INTERNAL_FIELDS

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Upload staging directory ───────────────────────────────────────────────────
STAGING_DIR = Path(__file__).resolve().parent.parent.parent / "tmp" / "uploads"
STAGING_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
PREVIEW_ROW_COUNT = 20


# ── Auth helper (reuses existing decode_token from security.py) ────────────────
def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or payload.get("type") == "refresh":
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── POST /uploads ──────────────────────────────────────────────────────────────
@router.post("", response_model=UploadInitResponse)
async def create_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_ts = time.time()
    upload_id = str(uuid.uuid4())
    logger.info("upload_started upload_id=%s user_id=%s filename=%s", upload_id, current_user.id, file.filename)

    # ── 1. Validate file type ──────────────────────────────────────────────────
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    # ── 2. Read file bytes, enforce size limit ─────────────────────────────────
    raw_bytes = await file.read()
    if len(raw_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(raw_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the 50 MB limit ({len(raw_bytes) // (1024*1024)} MB uploaded).",
        )

    # ── 3. Decode and parse CSV headers + preview ──────────────────────────────
    try:
        text = raw_bytes.decode("utf-8", errors="replace")
        preview_df = pd.read_csv(io.StringIO(text), nrows=PREVIEW_ROW_COUNT, low_memory=False)
    except Exception as exc:
        logger.error("upload_id=%s CSV parse error: %s", upload_id, exc)
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}")

    raw_headers = list(preview_df.columns)

    # ── 4. Schema detection (validates headers internally) ─────────────────────
    detection = detect_schema(raw_headers)
    if detection["validation_error"]:
        raise HTTPException(status_code=400, detail=detection["validation_error"])

    # ── 5. Stage the file to disk ──────────────────────────────────────────────
    staged_path = STAGING_DIR / f"{upload_id}.csv"
    staged_path.write_bytes(raw_bytes)
    logger.info("upload_staged upload_id=%s path=%s", upload_id, staged_path)

    # ── 6. Determine initial status ────────────────────────────────────────────
    has_unmatched = bool(detection["unmatched_required_fields"])
    below_threshold = detection["confidence"] < 0.70
    status = "mapping_required" if (has_unmatched or below_threshold) else "uploaded"

    # ── 7. Persist Upload record ───────────────────────────────────────────────
    upload_record = Upload(
        id=uuid.UUID(upload_id),
        user_id=current_user.id,
        original_filename=file.filename or "upload.csv",
        marketplace_detected=detection["marketplace"],
        detection_confidence=detection["confidence"],
        status=status,
        row_count_raw=None,
        row_count_processed=None,
        row_count_excluded=None,
    )
    db.add(upload_record)
    db.commit()

    elapsed = round(time.time() - start_ts, 3)
    logger.info(
        "upload_completed upload_id=%s marketplace=%s confidence=%.2f status=%s elapsed=%.3fs",
        upload_id, detection["marketplace"], detection["confidence"], status, elapsed,
    )

    preview_rows = preview_df.head(PREVIEW_ROW_COUNT).to_dict(orient="records")

    return UploadInitResponse(
        uploadId=upload_id,
        marketplaceDetected=detection["marketplace"],
        confidence=detection["confidence"],
        proposedMapping=detection["proposed_mapping"],
        unmatchedRequiredFields=detection["unmatched_required_fields"],
        previewRows=preview_rows,
        status=status,
    )


# ── POST /uploads/{uploadId}/confirm-mapping ───────────────────────────────────
@router.post("/{upload_id}/confirm-mapping")
def confirm_mapping(
    upload_id: str,
    body: ConfirmMappingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_ts = time.time()
    logger.info("confirm_mapping_started upload_id=%s user_id=%s", upload_id, current_user.id)

    # ── 1. Look up Upload record ───────────────────────────────────────────────
    try:
        uid = uuid.UUID(upload_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Upload not found.")

    upload_record = (
        db.query(Upload)
        .filter(Upload.id == uid, Upload.user_id == current_user.id)
        .first()
    )
    if not upload_record:
        raise HTTPException(status_code=404, detail="Upload not found.")

    # ── 2. Validate all required internal fields are mapped ────────────────────
    mapping = body.mapping
    missing_fields = [f for f in REQUIRED_INTERNAL_FIELDS if not mapping.get(f)]
    if missing_fields:
        raise HTTPException(
            status_code=422,
            detail=f"Required fields not mapped: {', '.join(missing_fields)}. "
                   "All required fields must have a source column assigned before processing.",
        )

    # ── 3. Load staged file ────────────────────────────────────────────────────
    staged_path = STAGING_DIR / f"{upload_id}.csv"
    if not staged_path.exists():
        raise HTTPException(
            status_code=409,
            detail="Staged file not found. Please re-upload the CSV.",
        )

    try:
        raw_df = pd.read_csv(str(staged_path), low_memory=False, dtype=str)
    except Exception as exc:
        logger.error("confirm_mapping staged file read error upload_id=%s: %s", upload_id, exc)
        upload_record.status = "failed"
        upload_record.error_message = f"Could not re-read staged file: {exc}"
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to re-read the staged CSV.")

    # ── 4. Apply confirmed column mapping (rename source cols → internal names) ─
    # Only rename columns that exist in the DataFrame
    rename_map = {
        source_col: internal_field
        for internal_field, source_col in mapping.items()
        if source_col in raw_df.columns
    }
    df_mapped = raw_df.rename(columns=rename_map)

    # ── 5. Mark as processing ──────────────────────────────────────────────────
    upload_record.status = "processing"
    db.commit()

    # ── 6. Full pipeline inside an atomic transaction ──────────────────────────
    try:
        # Data processing
        processing_result = process_dataframe(
            df=df_mapped,
            upload_id=upload_id,
            user_id=str(current_user.id),
        )

        rows = processing_result["rows"]

        # Risk scoring (Merchant-only; modifies rows in-place)
        rows = apply_risk_scores(rows)

        # ── 7. Atomic DB transaction: delete old orders, bulk insert new ───────
        # SQLAlchemy begin() context manager — rolls back on any exception
        with db.begin_nested():
            # Delete previous orders for this user (MVP: one active dataset per user)
            db.query(Order).filter(Order.user_id == current_user.id).delete(
                synchronize_session=False
            )

            # Bulk insert using SQLAlchemy's bulk_insert_mappings for performance
            if rows:
                db.bulk_insert_mappings(Order, rows)

            # Update the Upload record
            upload_record.status = "ready"
            upload_record.row_count_raw = processing_result["row_count_raw"]
            upload_record.row_count_processed = processing_result["row_count_processed"]
            upload_record.row_count_excluded = processing_result["row_count_excluded"]
            upload_record.processed_at = utcnow()
            upload_record.error_message = None

            # Store exclusion_reasons and categories as JSON in error_message field
            # (We store metadata in a side-channel since the Upload model has limited fields)
            # Use a dedicated JSON blob stored in the error_message column repurposed
            # Only set if no error — safe since error_message is None on success
            meta = {
                "exclusion_reasons": processing_result["exclusion_reasons"],
                "categories_found": processing_result["categories_found"],
                "date_min": processing_result["date_min"],
                "date_max": processing_result["date_max"],
            }
            # Store as JSON in a metadata-style way — we'll parse it in /summary
            upload_record.error_message = json.dumps(meta)

        db.commit()

        # Clean up staged file after successful processing
        try:
            staged_path.unlink()
        except Exception:
            pass  # non-critical

        elapsed = round(time.time() - start_ts, 3)
        logger.info(
            "confirm_mapping_completed upload_id=%s processed=%d excluded=%d elapsed=%.3fs",
            upload_id,
            processing_result["row_count_processed"],
            processing_result["row_count_excluded"],
            elapsed,
        )

        return {
            "uploadId": upload_id,
            "status": "ready",
            "rowCountRaw": processing_result["row_count_raw"],
            "rowCountProcessed": processing_result["row_count_processed"],
            "rowCountExcluded": processing_result["row_count_excluded"],
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(
            "confirm_mapping_failed upload_id=%s error=%s", upload_id, exc, exc_info=True
        )
        upload_record.status = "failed"
        upload_record.error_message = str(exc)
        db.commit()
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {exc}",
        )


# ── GET /uploads/current ───────────────────────────────────────────────────────
# Must be declared BEFORE /{upload_id}/status to avoid route shadowing
@router.get("/current")
def get_current_upload(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload_record = (
        db.query(Upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Upload.uploaded_at.desc())
        .first()
    )
    if not upload_record:
        return JSONResponse(content=None, status_code=200)

    return CurrentUploadResponse(
        uploadId=str(upload_record.id),
        status=upload_record.status,
        originalFilename=upload_record.original_filename,
        marketplaceDetected=upload_record.marketplace_detected,
        rowCountProcessed=upload_record.row_count_processed,
        uploadedAt=upload_record.uploaded_at.isoformat(),
    )


# ── GET /uploads/{uploadId}/status ────────────────────────────────────────────
@router.get("/{upload_id}/status", response_model=UploadStatusResponse)
def get_upload_status(
    upload_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        uid = uuid.UUID(upload_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Upload not found.")

    upload_record = (
        db.query(Upload)
        .filter(Upload.id == uid, Upload.user_id == current_user.id)
        .first()
    )
    if not upload_record:
        raise HTTPException(status_code=404, detail="Upload not found.")

    # Don't expose the JSON metadata blob as an error message
    error_msg = upload_record.error_message
    if upload_record.status == "ready" and error_msg and error_msg.startswith("{"):
        error_msg = None

    return UploadStatusResponse(
        uploadId=str(upload_record.id),
        status=upload_record.status,
        rowCountRaw=upload_record.row_count_raw,
        rowCountProcessed=upload_record.row_count_processed,
        rowCountExcluded=upload_record.row_count_excluded,
        errorMessage=error_msg,
    )


# ── GET /uploads/{uploadId}/summary ───────────────────────────────────────────
@router.get("/{upload_id}/summary", response_model=UploadSummaryResponse)
def get_upload_summary(
    upload_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        uid = uuid.UUID(upload_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Upload not found.")

    upload_record = (
        db.query(Upload)
        .filter(Upload.id == uid, Upload.user_id == current_user.id)
        .first()
    )
    if not upload_record:
        raise HTTPException(status_code=404, detail="Upload not found.")

    if upload_record.status != "ready":
        raise HTTPException(
            status_code=409,
            detail=f"Upload is not ready yet (status: {upload_record.status}).",
        )

    # Parse metadata stored as JSON in error_message field
    meta: dict = {}
    try:
        if upload_record.error_message and upload_record.error_message.startswith("{"):
            meta = json.loads(upload_record.error_message)
    except Exception:
        pass

    exclusion_reasons_raw: dict = meta.get("exclusion_reasons", {})
    exclusion_reasons = [
        ExclusionReason(reason=k, count=v)
        for k, v in exclusion_reasons_raw.items()
        if v > 0
    ]

    return UploadSummaryResponse(
        uploadId=str(upload_record.id),
        status=upload_record.status,
        originalFilename=upload_record.original_filename,
        marketplaceDetected=upload_record.marketplace_detected,
        confidence=upload_record.detection_confidence,
        rowCountRaw=upload_record.row_count_raw,
        rowCountProcessed=upload_record.row_count_processed,
        rowCountExcluded=upload_record.row_count_excluded,
        exclusionReasons=exclusion_reasons,
        categoriesFound=meta.get("categories_found", []),
        dateMin=meta.get("date_min"),
        dateMax=meta.get("date_max"),
        uploadedAt=upload_record.uploaded_at.isoformat(),
        processedAt=upload_record.processed_at.isoformat() if upload_record.processed_at else None,
    )
