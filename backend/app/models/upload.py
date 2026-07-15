"""
Pydantic schemas for the /uploads/* endpoints.
"""

from __future__ import annotations

from typing import Dict, List, Optional
from pydantic import BaseModel


# ── Request bodies ─────────────────────────────────────────────────────────────

class ConfirmMappingRequest(BaseModel):
    """Body for POST /uploads/{uploadId}/confirm-mapping."""
    # Maps internal canonical field name -> source CSV column name
    # e.g. {"order_id": "Order ID", "date": "Date", ...}
    mapping: Dict[str, str]


# ── Response bodies ────────────────────────────────────────────────────────────

class PreviewRow(BaseModel):
    """A single row from the CSV preview (raw, unmapped)."""
    # Arbitrary column -> value mapping; no fixed schema at this stage.
    class Config:
        extra = "allow"


class UploadInitResponse(BaseModel):
    """Response from POST /uploads."""
    uploadId: str
    marketplaceDetected: Optional[str]
    confidence: float
    proposedMapping: Dict[str, str]
    unmatchedRequiredFields: List[str]
    previewRows: List[Dict]
    status: str    # 'uploaded' | 'mapping_required'


class UploadStatusResponse(BaseModel):
    """Response from GET /uploads/{uploadId}/status."""
    uploadId: str
    status: str
    rowCountRaw: Optional[int]
    rowCountProcessed: Optional[int]
    rowCountExcluded: Optional[int]
    errorMessage: Optional[str]


class ExclusionReason(BaseModel):
    reason: str
    count: int


class UploadSummaryResponse(BaseModel):
    """Response from GET /uploads/{uploadId}/summary (status must be 'ready')."""
    uploadId: str
    status: str
    originalFilename: str
    marketplaceDetected: Optional[str]
    confidence: Optional[float]
    rowCountRaw: Optional[int]
    rowCountProcessed: Optional[int]
    rowCountExcluded: Optional[int]
    exclusionReasons: List[ExclusionReason]
    categoriesFound: List[str]
    dateMin: Optional[str]
    dateMax: Optional[str]
    uploadedAt: str
    processedAt: Optional[str]


class CurrentUploadResponse(BaseModel):
    """Response from GET /uploads/current — null body if no active upload."""
    uploadId: str
    status: str
    originalFilename: str
    marketplaceDetected: Optional[str]
    rowCountProcessed: Optional[int]
    uploadedAt: str
