from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.uploads import get_current_user
from app.db.models import User, Upload
from app.models.analytics import (
    OverviewResponse, ProfitOverviewResponse, ProductsResponse,
    RiskOverviewResponse, RiskOrdersResponse, RecommendationsResponse,
)
from app.services.analytics_service import (
    get_dashboard_overview,
    get_profit_overview,
    get_products_paginated,
    get_risk_overview,
    get_risk_orders_paginated,
)
from app.services.recommendation_service import generate_recommendations
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


# ── Module 7 ─────────────────────────────────────────────────────────────────

@router.get("/risk-overview", response_model=RiskOverviewResponse)
def get_risk_overview_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns summary statistics, tier counts, top risky categories/states,
    and heatmap cell grid for Merchant-fulfilled orders.
    """
    upload = _get_ready_upload(db, current_user)
    try:
        return get_risk_overview(db, str(upload.id))
    except Exception as e:
        logger.error(f"Error generating risk overview for upload {upload.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate risk overview.")


@router.get("/risk-orders", response_model=RiskOrdersResponse)
def get_risk_orders_endpoint(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    sortBy: str = Query(default="riskProbability", pattern="^(riskProbability|amount|category|shipState)$"),
    sortOrder: str = Query(default="desc", pattern="^(asc|desc)$"),
    search: Optional[str] = Query(default=None, max_length=100),
    category: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    tier: Optional[str] = Query(default=None, pattern="^(high|medium|low)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    SQL-level paginated, sortable, searchable risk order analytics.
    Filterable by category, state, search query, or risk tier (high|medium|low).
    Includes usedFallback flag for low confidence warnings.
    """
    upload = _get_ready_upload(db, current_user)
    try:
        return get_risk_orders_paginated(
            db=db,
            upload_id=str(upload.id),
            page=page,
            page_size=pageSize,
            sort_by=sortBy,
            sort_order=sortOrder,
            search=search,
            category=category,
            state=state,
            tier=tier,
        )
    except Exception as e:
        logger.error(f"Error generating risk orders for upload {upload.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate risk orders data.")


@router.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns rule-based, deterministic recommendations for categories with high return risk.
    Each item contains all 6 fields (reason, evidence, businessImpact, suggestedAction, priority, expectedImprovement).
    Expected improvement is grounded in historical return losses (₹140 * return count gap).
    """
    upload = _get_ready_upload(db, current_user)
    try:
        recs = generate_recommendations(db, str(upload.id))
        return RecommendationsResponse(recommendations=recs)
    except Exception as e:
        logger.error(f"Error generating recommendations for upload {upload.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate recommendations.")

