from typing import List, Optional, Any
from pydantic import BaseModel

# ── Module 5 — Overview models ─────────────────────────────────────────────

class KPIData(BaseModel):
    value: float | int | None
    deltaPercent: float | None
    deltaDirection: str  # "up", "down", "neutral"

class OverviewKPIs(BaseModel):
    revenue: KPIData
    estimatedProfit: KPIData
    profitMargin: KPIData
    orders: KPIData
    averageOrderValue: KPIData
    returnRate: KPIData

class TrendPoint(BaseModel):
    period: str
    revenue: float
    profit: float

class CategoryPerformance(BaseModel):
    name: Optional[str]
    profit: float

class StatePerformance(BaseModel):
    name: Optional[str]
    revenue: float

class ActivityRow(BaseModel):
    orderId: str
    date: Optional[str]
    category: Optional[str]
    amount: float
    status: Optional[str]

class OverviewResponse(BaseModel):
    kpis: OverviewKPIs
    revenueTrend: List[TrendPoint]
    topCategory: Optional[CategoryPerformance]
    worstCategory: Optional[CategoryPerformance]
    topState: Optional[StatePerformance]
    recentActivity: List[ActivityRow]
    insights: List[str]


# ── Module 6 — Profit Analytics models ────────────────────────────────────

class CategoryProfitRow(BaseModel):
    category: str
    revenue: float
    profit: float
    marginPercent: float
    orders: int

class CostItem(BaseModel):
    value: float
    percentOfRevenue: float

class CostBreakdown(BaseModel):
    cogs: CostItem
    platformFee: CostItem
    shippingCost: CostItem
    gst: CostItem
    returnLoss: CostItem

class ProfitTrendPoint(BaseModel):
    period: str
    revenue: float
    profit: float

class InventoryCandidate(BaseModel):
    name: str        # category name
    reason: str

class InventoryOpportunity(BaseModel):
    increaseCandidates: List[InventoryCandidate]
    reviewCandidates: List[InventoryCandidate]

class ProfitOverviewResponse(BaseModel):
    categoryPerformance: List[CategoryProfitRow]
    costBreakdown: CostBreakdown
    monthlyTrend: List[ProfitTrendPoint]
    inventoryOpportunity: InventoryOpportunity

class ProductRow(BaseModel):
    sku: str
    category: Optional[str]
    unitsSold: int
    revenue: float
    profit: float
    marginPercent: float

class ProductsResponse(BaseModel):
    rows: List[ProductRow]
    totalRows: int
    page: int
    pageSize: int
