import logging
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc, asc, text

from app.db.models import Order
from app.models.analytics import (
    # Module 5 Overview
    OverviewKPIs, KPIData, TrendPoint, CategoryPerformance,
    StatePerformance, ActivityRow, OverviewResponse,
    # Module 6 Profit Analytics
    CategoryProfitRow, CostItem, CostBreakdown, ProfitTrendPoint,
    InventoryCandidate, InventoryOpportunity, ProfitOverviewResponse,
    ProductRow, ProductsResponse,
)

logger = logging.getLogger(__name__)

# ── Delta helper ──────────────────────────────────────────────────────────────

def _calc_delta(current: float, previous: float) -> Tuple[Optional[float], str]:
    """Returns (deltaPercent, direction). Returns (None, 'neutral') if no prior data."""
    if not previous:
        return None, "neutral"
    delta = ((current - previous) / abs(previous)) * 100
    direction = "up" if delta > 0 else "down" if delta < 0 else "neutral"
    return round(delta, 2), direction


# ── KPI Aggregation ───────────────────────────────────────────────────────────

def get_overview_kpis(db: Session, upload_id: str, current_month: str, previous_month: str) -> OverviewKPIs:
    """
    Computes KPIs for total dataset and month-over-month deltas.
    
    Formulas:
      - Revenue = SUM(amount)
      - Estimated Profit = SUM(estimated_profit)
      - Profit Margin = Estimated Profit / Revenue * 100
      - Avg Order Value = Revenue / COUNT(orders)
      - Return Rate = SUM(return_flag=1 WHERE return_flag IS NOT NULL) /
                      COUNT(WHERE return_flag IS NOT NULL) * 100
        (Excludes Amazon-fulfilled rows where return_flag IS NULL)
    """
    # All-time totals (single aggregate pass)
    total = db.query(
        func.sum(Order.amount).label("revenue"),
        func.sum(Order.estimated_profit).label("profit"),
        func.count(Order.id).label("orders"),
        func.sum(case((Order.return_flag == 1, 1), else_=0)).label("returned_merchant"),
        func.sum(case((Order.return_flag.isnot(None), 1), else_=0)).label("total_merchant"),
    ).filter(Order.upload_id == upload_id).first()

    if not total or not total.orders:
        neutral = KPIData(value=0, deltaPercent=None, deltaDirection="neutral")
        return OverviewKPIs(
            revenue=neutral, estimatedProfit=neutral, profitMargin=neutral,
            orders=neutral, averageOrderValue=neutral, returnRate=neutral
        )

    total_revenue = float(total.revenue or 0)
    total_profit = float(total.profit or 0)
    total_orders = int(total.orders)
    total_margin = (total_profit / total_revenue * 100) if total_revenue else 0
    total_aov = (total_revenue / total_orders) if total_orders else 0
    total_merchant = int(total.total_merchant or 0)
    returned_merchant = int(total.returned_merchant or 0)
    total_return_rate = (returned_merchant / total_merchant * 100) if total_merchant else 0

    # Per-month breakdown using PostgreSQL's to_char for clean YYYY-MM slicing
    month_label = func.to_char(Order.date, "YYYY-MM").label("month")
    month_rows = db.query(
        month_label,
        func.sum(Order.amount).label("revenue"),
        func.sum(Order.estimated_profit).label("profit"),
        func.count(Order.id).label("orders"),
        func.sum(case((Order.return_flag == 1, 1), else_=0)).label("returned_merchant"),
        func.sum(case((Order.return_flag.isnot(None), 1), else_=0)).label("total_merchant"),
    ).filter(
        Order.upload_id == upload_id,
        Order.date.isnot(None),
        func.to_char(Order.date, "YYYY-MM").in_([current_month, previous_month]),
    ).group_by(func.to_char(Order.date, "YYYY-MM")).all()

    by_month = {r.month: r for r in month_rows}
    curr = by_month.get(current_month)
    prev = by_month.get(previous_month)

    def _kpi(total_val: float, curr_val: float, prev_val: float) -> KPIData:
        if curr is None or prev is None:
            return KPIData(value=round(total_val, 2), deltaPercent=None, deltaDirection="neutral")
        delta, direction = _calc_delta(curr_val, prev_val)
        return KPIData(value=round(total_val, 2), deltaPercent=delta, deltaDirection=direction)

    def _safe(row, attr: str, default: float = 0.0) -> float:
        return float(getattr(row, attr) or 0) if row else default

    c_rev = _safe(curr, "revenue")
    p_rev = _safe(prev, "revenue")
    c_prof = _safe(curr, "profit")
    p_prof = _safe(prev, "profit")
    c_ord = int(_safe(curr, "orders"))
    p_ord = int(_safe(prev, "orders"))
    c_ret_m = int(_safe(curr, "returned_merchant"))
    p_ret_m = int(_safe(prev, "returned_merchant"))
    c_tot_m = int(_safe(curr, "total_merchant"))
    p_tot_m = int(_safe(prev, "total_merchant"))

    c_margin = (c_prof / c_rev * 100) if c_rev else 0
    p_margin = (p_prof / p_rev * 100) if p_rev else 0
    c_aov = (c_rev / c_ord) if c_ord else 0
    p_aov = (p_rev / p_ord) if p_ord else 0
    c_rr = (c_ret_m / c_tot_m * 100) if c_tot_m else 0
    p_rr = (p_ret_m / p_tot_m * 100) if p_tot_m else 0

    return OverviewKPIs(
        revenue=_kpi(total_revenue, c_rev, p_rev),
        estimatedProfit=_kpi(total_profit, c_prof, p_prof),
        profitMargin=_kpi(total_margin, c_margin, p_margin),
        orders=_kpi(total_orders, c_ord, p_ord),
        averageOrderValue=_kpi(total_aov, c_aov, p_aov),
        returnRate=_kpi(total_return_rate, c_rr, p_rr),
    )


# ── Revenue Trend ─────────────────────────────────────────────────────────────

def get_revenue_trend(db: Session, upload_id: str) -> List[TrendPoint]:
    """
    Buckets data by calendar month using to_char(date, 'YYYY-MM').
    Returns sorted list of TrendPoints.
    """
    month_label = func.to_char(Order.date, "YYYY-MM")
    rows = db.query(
        month_label.label("period"),
        func.sum(Order.amount).label("revenue"),
        func.sum(Order.estimated_profit).label("profit"),
    ).filter(
        Order.upload_id == upload_id,
        Order.date.isnot(None),
    ).group_by(month_label).order_by(month_label).all()

    return [
        TrendPoint(
            period=r.period,
            revenue=round(float(r.revenue or 0), 2),
            profit=round(float(r.profit or 0), 2),
        )
        for r in rows
    ]


# ── Category Performance ──────────────────────────────────────────────────────

def get_category_performance(db: Session, upload_id: str) -> Tuple[Optional[CategoryPerformance], Optional[CategoryPerformance]]:
    """Returns (top_category, worst_category) by summed estimated_profit."""
    rows = db.query(
        Order.category,
        func.sum(Order.estimated_profit).label("profit"),
    ).filter(
        Order.upload_id == upload_id,
        Order.category.isnot(None),
    ).group_by(Order.category).order_by(desc("profit")).all()

    if not rows:
        return None, None

    top = CategoryPerformance(name=rows[0].category, profit=round(float(rows[0].profit), 2))
    worst = CategoryPerformance(name=rows[-1].category, profit=round(float(rows[-1].profit), 2))
    return top, worst


# ── State Performance ─────────────────────────────────────────────────────────

def get_state_performance(db: Session, upload_id: str) -> Optional[StatePerformance]:
    """Returns top state by summed revenue."""
    row = db.query(
        Order.ship_state,
        func.sum(Order.amount).label("revenue"),
    ).filter(
        Order.upload_id == upload_id,
        Order.ship_state.isnot(None),
    ).group_by(Order.ship_state).order_by(desc("revenue")).first()

    if not row:
        return None
    return StatePerformance(name=row.ship_state, revenue=round(float(row.revenue), 2))


# ── Recent Activity ───────────────────────────────────────────────────────────

def get_recent_activity(db: Session, upload_id: str) -> List[ActivityRow]:
    """Returns the 10 most recent orders. Ties broken by order_id DESC."""
    rows = db.query(
        Order.order_id,
        Order.date,
        Order.category,
        Order.amount,
        Order.status,
    ).filter(
        Order.upload_id == upload_id,
    ).order_by(
        desc(Order.date),
        desc(Order.order_id),
    ).limit(10).all()

    return [
        ActivityRow(
            orderId=str(r.order_id or ""),
            date=str(r.date) if r.date else None,
            category=r.category,
            amount=round(float(r.amount or 0), 2),
            status=r.status,
        )
        for r in rows
    ]


# ── Insights ──────────────────────────────────────────────────────────────────

def generate_insights(
    kpis: OverviewKPIs,
    top_category: Optional[CategoryPerformance],
    top_state: Optional[StatePerformance],
) -> List[str]:
    """
    Generates plain-language rule-based observations from the same aggregates
    shown in the KPI cards. No LLM/AI — deterministic only.
    """
    insights: List[str] = []

    # Revenue trend insight
    if kpis.revenue.deltaPercent is not None:
        if kpis.revenue.deltaDirection == "up":
            insights.append(f"Revenue grew by {kpis.revenue.deltaPercent:.1f}% month-over-month.")
        elif kpis.revenue.deltaDirection == "down":
            insights.append(f"Revenue declined by {abs(kpis.revenue.deltaPercent):.1f}% vs. the previous month.")

    # Profit margin insight
    if kpis.profitMargin.value is not None:
        margin = kpis.profitMargin.value
        if margin < 10:
            insights.append(
                f"Profit margin is below 10% ({margin:.1f}%). Review pricing, platform fees, or shipping costs."
            )
        elif margin >= 20:
            insights.append(f"Strong profit margin of {margin:.1f}%. You are retaining a healthy share of revenue.")

    # Top category insight
    if top_category and top_category.name:
        insights.append(f"{top_category.name.title()} is your strongest category by profit.")

    # Top state insight
    if top_state and top_state.name:
        revenue_str = f"₹{top_state.revenue:,.0f}"
        insights.append(f"{top_state.name} leads all states with {revenue_str} in revenue.")

    # Return rate insight
    if kpis.returnRate.value is not None and kpis.returnRate.value > 15:
        insights.append(
            f"Merchant-fulfilled return rate is {kpis.returnRate.value:.1f}%, "
            "which is above the 15% threshold — this warrants investigation."
        )

    if not insights:
        insights.append(
            "Upload more months of data to unlock month-over-month comparisons and trend insights."
        )

    return insights


# ── Orchestrator ──────────────────────────────────────────────────────────────

def get_dashboard_overview(db: Session, upload_id: str) -> OverviewResponse:
    """
    Orchestrates all aggregation functions and returns the full OverviewResponse.
    The router calls this single entry point.
    """
    # 1. Trend (also determines current/previous months)
    trend = get_revenue_trend(db, upload_id)
    current_month = trend[-1].period if len(trend) >= 1 else ""
    previous_month = trend[-2].period if len(trend) >= 2 else ""

    # 2. KPIs with delta
    kpis = get_overview_kpis(db, upload_id, current_month, previous_month)

    # 3. Category & state
    top_cat, worst_cat = get_category_performance(db, upload_id)
    top_state = get_state_performance(db, upload_id)

    # 4. Recent orders
    activity = get_recent_activity(db, upload_id)

    # 5. Rule-based insights (uses the same aggregates — no separate data source)
    insights = generate_insights(kpis, top_cat, top_state)

    return OverviewResponse(
        kpis=kpis,
        revenueTrend=trend,
        topCategory=top_cat,
        worstCategory=worst_cat,
        topState=top_state,
        recentActivity=activity,
        insights=insights,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE 6 — Profit Analytics functions
# ═══════════════════════════════════════════════════════════════════════════════

def get_category_profit(db: Session, upload_id: str) -> List[CategoryProfitRow]:
    """
    GROUP BY category: revenue, profit, marginPercent, order count.
    Sorted by profit descending so top performers appear first.
    """
    rows = db.query(
        Order.category,
        func.sum(Order.amount).label("revenue"),
        func.sum(Order.estimated_profit).label("profit"),
        func.count(Order.id).label("orders"),
    ).filter(
        Order.upload_id == upload_id,
        Order.category.isnot(None),
    ).group_by(Order.category).order_by(desc("profit")).all()

    result = []
    for r in rows:
        rev = float(r.revenue or 0)
        prof = float(r.profit or 0)
        margin = (prof / rev * 100) if rev else 0.0
        result.append(CategoryProfitRow(
            category=r.category,
            revenue=round(rev, 2),
            profit=round(prof, 2),
            marginPercent=round(margin, 2),
            orders=int(r.orders),
        ))
    return result


def get_cost_breakdown(db: Session, upload_id: str) -> CostBreakdown:
    """
    Sums each cost component across the entire upload.
    Returns each as an absolute value and as a % of total revenue.
    """
    row = db.query(
        func.sum(Order.amount).label("revenue"),
        func.sum(Order.estimated_cogs).label("cogs"),
        func.sum(Order.platform_fee).label("platform_fee"),
        func.sum(Order.shipping_cost).label("shipping_cost"),
        func.sum(Order.gst).label("gst"),
        func.sum(Order.return_loss).label("return_loss"),
    ).filter(Order.upload_id == upload_id).first()

    revenue = float(row.revenue or 0)

    def _item(val) -> CostItem:
        v = float(val or 0)
        pct = (v / revenue * 100) if revenue else 0.0
        return CostItem(value=round(v, 2), percentOfRevenue=round(pct, 2))

    return CostBreakdown(
        cogs=_item(row.cogs),
        platformFee=_item(row.platform_fee),
        shippingCost=_item(row.shipping_cost),
        gst=_item(row.gst),
        returnLoss=_item(row.return_loss),
    )


def get_profit_monthly_trend(
    db: Session, upload_id: str, category: Optional[str] = None
) -> List[ProfitTrendPoint]:
    """
    Monthly revenue + profit bucketed with to_char(date, 'YYYY-MM').
    Accepts an optional category filter — used by the dropdown in MonthlyProfitTrendChart.
    """
    month_label = func.to_char(Order.date, "YYYY-MM")
    q = db.query(
        month_label.label("period"),
        func.sum(Order.amount).label("revenue"),
        func.sum(Order.estimated_profit).label("profit"),
    ).filter(
        Order.upload_id == upload_id,
        Order.date.isnot(None),
    )
    if category:
        q = q.filter(Order.category == category)

    rows = q.group_by(month_label).order_by(month_label).all()
    return [
        ProfitTrendPoint(
            period=r.period,
            revenue=round(float(r.revenue or 0), 2),
            profit=round(float(r.profit or 0), 2),
        )
        for r in rows
    ]


MIN_ORDERS_FOR_REVIEW = 5  # minimum order count before flagging for review/discontinue


def get_inventory_opportunities(
    db: Session, upload_id: str
) -> InventoryOpportunity:
    """
    Increase candidates: top-quartile margin AND top-half units sold (category level).
    Review candidates: negative aggregate profit with MIN_ORDERS_FOR_REVIEW+ orders.
    Operates at the category level — avoids SKU-level noise from small samples.
    """
    rows = db.query(
        Order.category,
        func.sum(Order.amount).label("revenue"),
        func.sum(Order.estimated_profit).label("profit"),
        func.sum(Order.qty).label("units"),
        func.count(Order.id).label("orders"),
    ).filter(
        Order.upload_id == upload_id,
        Order.category.isnot(None),
    ).group_by(Order.category).all()

    if not rows:
        return InventoryOpportunity(increaseCandidates=[], reviewCandidates=[])

    # Compute margins and units lists for quartile/median thresholds
    enriched = []
    for r in rows:
        rev = float(r.revenue or 0)
        prof = float(r.profit or 0)
        margin = (prof / rev * 100) if rev else 0.0
        enriched.append({
            "category": r.category,
            "margin": margin,
            "units": int(r.units or 0),
            "profit": prof,
            "orders": int(r.orders),
        })

    margins = sorted([e["margin"] for e in enriched])
    units_list = sorted([e["units"] for e in enriched])

    n = len(margins)
    margin_q75 = margins[int(n * 0.75)] if n > 1 else margins[0]
    units_median = units_list[n // 2] if n > 1 else units_list[0]

    increase_candidates = []
    review_candidates = []

    for e in enriched:
        if e["margin"] >= margin_q75 and e["units"] >= units_median:
            increase_candidates.append(InventoryCandidate(
                name=e["category"],
                reason=f"High margin ({e['margin']:.1f}%) with strong sales volume — consider increasing inventory.",
            ))
        if e["profit"] < 0 and e["orders"] >= MIN_ORDERS_FOR_REVIEW:
            review_candidates.append(InventoryCandidate(
                name=e["category"],
                reason=f"Negative profit across {e['orders']} orders — review pricing, fees, or discontinue.",
            ))

    return InventoryOpportunity(
        increaseCandidates=increase_candidates,
        reviewCandidates=review_candidates,
    )


def get_profit_overview(
    db: Session, upload_id: str, category: Optional[str] = None
) -> ProfitOverviewResponse:
    """
    Orchestrator for GET /analytics/profit-overview.
    The optional category param filters ONLY the monthlyTrend slice.
    """
    category_perf = get_category_profit(db, upload_id)
    cost_bd = get_cost_breakdown(db, upload_id)
    monthly = get_profit_monthly_trend(db, upload_id, category=category)
    inventory = get_inventory_opportunities(db, upload_id)

    return ProfitOverviewResponse(
        categoryPerformance=category_perf,
        costBreakdown=cost_bd,
        monthlyTrend=monthly,
        inventoryOpportunity=inventory,
    )


# Allowed sort columns for products query — validated at the service layer
_PRODUCTS_SORT_COLUMNS = {
    "revenue": Order.amount,
    "profit": Order.estimated_profit,
    "unitsSold": Order.qty,
    "marginPercent": None,   # computed, handled specially
}


def get_products_paginated(
    db: Session,
    upload_id: str,
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "profit",
    sort_order: str = "desc",
    search: Optional[str] = None,
    category: Optional[str] = None,
) -> ProductsResponse:
    """
    SQL-level paginated, sortable, searchable products query.
    GROUP BY sku; LIMIT/OFFSET at the DB — never loaded into pandas.
    """
    page = max(1, page)
    page_size = min(max(1, page_size), 100)

    # Base aggregation subquery
    revenue_col = func.sum(Order.amount).label("revenue")
    profit_col = func.sum(Order.estimated_profit).label("profit")
    units_col = func.sum(Order.qty).label("units_sold")
    orders_col = func.count(Order.id).label("orders")

    q = db.query(
        Order.sku,
        Order.category,
        units_col,
        revenue_col,
        profit_col,
        orders_col,
    ).filter(
        Order.upload_id == upload_id,
        Order.sku.isnot(None),
    )

    if search:
        pattern = f"%{search}%"
        q = q.filter(
            (Order.sku.ilike(pattern)) | (Order.category.ilike(pattern))
        )
    if category:
        q = q.filter(Order.category == category)

    q = q.group_by(Order.sku, Order.category)

    # Sorting — marginPercent is a derived column; we approximate it by ordering
    # profit/revenue ratio using a CASE expression to avoid division by zero
    if sort_by == "marginPercent":
        margin_expr = case(
            (func.sum(Order.amount) > 0,
             func.sum(Order.estimated_profit) / func.sum(Order.amount)),
            else_=0
        )
        order_expr = desc(margin_expr) if sort_order == "desc" else asc(margin_expr)
    elif sort_by == "unitsSold":
        order_expr = desc(func.sum(Order.qty)) if sort_order == "desc" else asc(func.sum(Order.qty))
    elif sort_by == "revenue":
        order_expr = desc(func.sum(Order.amount)) if sort_order == "desc" else asc(func.sum(Order.amount))
    else:  # default: profit
        order_expr = desc(func.sum(Order.estimated_profit)) if sort_order == "desc" else asc(func.sum(Order.estimated_profit))

    q = q.order_by(order_expr)

    # Total count (before pagination) — use a count subquery for accuracy
    total = q.count()

    # Apply pagination at the DB layer
    rows = q.offset((page - 1) * page_size).limit(page_size).all()

    product_rows = []
    for r in rows:
        rev = float(r.revenue or 0)
        prof = float(r.profit or 0)
        margin = (prof / rev * 100) if rev else 0.0
        product_rows.append(ProductRow(
            sku=r.sku,
            category=r.category,
            unitsSold=int(r.units_sold or 0),
            revenue=round(rev, 2),
            profit=round(prof, 2),
            marginPercent=round(margin, 2),
        ))

    return ProductsResponse(
        rows=product_rows,
        totalRows=total,
        page=page,
        pageSize=page_size,
    )
