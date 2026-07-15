export interface CategoryProfitRow {
  category: string;
  revenue: number;
  profit: number;
  marginPercent: number;
  orders: number;
}

export interface CostItem {
  value: number;
  percentOfRevenue: number;
}

export interface CostBreakdown {
  cogs: CostItem;
  platformFee: CostItem;
  shippingCost: CostItem;
  gst: CostItem;
  returnLoss: CostItem;
}

export interface ProfitTrendPoint {
  period: string;
  revenue: number;
  profit: number;
}

export interface InventoryCandidate {
  name: string;
  reason: string;
}

export interface InventoryOpportunity {
  increaseCandidates: InventoryCandidate[];
  reviewCandidates: InventoryCandidate[];
}

export interface ProfitOverviewData {
  categoryPerformance: CategoryProfitRow[];
  costBreakdown: CostBreakdown;
  monthlyTrend: ProfitTrendPoint[];
  inventoryOpportunity: InventoryOpportunity;
}

export interface ProductRow {
  sku: string;
  category: string | null;
  unitsSold: number;
  revenue: number;
  profit: number;
  marginPercent: number;
}

export interface ProductsData {
  rows: ProductRow[];
  totalRows: number;
  page: number;
  pageSize: number;
}

export type ProductsSortBy = 'revenue' | 'profit' | 'marginPercent' | 'unitsSold';
export type SortOrder = 'asc' | 'desc';
