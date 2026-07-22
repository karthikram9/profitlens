import { apiRequest } from '../api-client';

export interface TierCounts {
  high: number;
  medium: number;
  low: number;
}

export interface RiskyCategoryRow {
  category: string;
  avgRisk: number;
  orderCount: number;
}

export interface RiskyStateRow {
  state: string;
  avgRisk: number;
  orderCount: number;
}

export interface HeatmapCell {
  category: string;
  state: string;
  avgRisk: number;
  orderCount: number;
  insufficientData: boolean;
}

export interface RiskOverviewResponse {
  tierCounts: TierCounts;
  avgRiskProbability: number;
  scoredOrderCount: number;
  unscoredOrderCount: number;
  topRiskyCategories: RiskyCategoryRow[];
  topRiskyStates: RiskyStateRow[];
  heatmap: HeatmapCell[];
}

export interface RiskOrderRow {
  id: string;
  orderId: string | null;
  category: string | null;
  amount: number;
  shipState: string | null;
  riskProbability: number | null;
  riskTier: string;
  usedFallback: boolean;
}

export interface RiskOrdersResponse {
  rows: RiskOrderRow[];
  totalRows: number;
  page: number;
  pageSize: number;
}

export interface RecommendationItem {
  id: string;
  category: string;
  reason: string;
  evidence: string;
  businessImpact: string;
  suggestedAction: string;
  priority: 'High' | 'Medium';
  expectedImprovement: string;
}

export interface RecommendationsResponse {
  recommendations: RecommendationItem[];
}

export async function fetchRiskOverview(): Promise<RiskOverviewResponse> {
  return apiRequest<RiskOverviewResponse>('/analytics/risk-overview');
}

export async function fetchRiskOrders(params: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  category?: string;
  state?: string;
  tier?: string;
}): Promise<RiskOrdersResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);
  if (params.search) query.append('search', params.search);
  if (params.category) query.append('category', params.category);
  if (params.state) query.append('state', params.state);
  if (params.tier) query.append('tier', params.tier);

  const qStr = query.toString();
  return apiRequest<RiskOrdersResponse>(`/analytics/risk-orders${qStr ? `?${qStr}` : ''}`);
}

export async function fetchRecommendations(): Promise<RecommendationsResponse> {
  return apiRequest<RecommendationsResponse>('/analytics/recommendations');
}
