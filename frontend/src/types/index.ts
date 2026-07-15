export interface Order {
  orderId: string;
  date: string;
  status: string;
  fulfilment: string;
  salesChannel: string;
  shipServiceLevel: string;
  category: string;
  sku: string;
  qty: number;
  amount: number;
  shipState: string;
  shipCity: string;
  b2b: boolean;
  estimatedCOGS?: number;
  platformFee?: number;
  shippingCost?: number;
  gst?: number;
  returnLoss?: number;
  estimatedProfit?: number;
}

export interface ReturnRiskPrediction {
  orderId: string;
  riskProbability: number; // 0.0 to 1.0
  riskTier: 'Low' | 'Medium' | 'High';
  predictedAt: string;
  usedFallback?: boolean;
}

export interface KPISummary {
  label: string;
  value: string | number;
  unit?: string;
  deltaPercent?: number;
  deltaDirection?: 'up' | 'down' | 'neutral';
}
