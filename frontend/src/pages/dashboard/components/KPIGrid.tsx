import React from 'react';
import { KPIStatCard } from '../../../components/ui/KPIStatCard';
import { Skeleton } from '../../../components/ui/Skeleton';

export interface KPIData {
  value: number | null;
  deltaPercent: number | null;
  deltaDirection: 'up' | 'down' | 'neutral';
}

export interface OverviewKPIs {
  revenue: KPIData;
  estimatedProfit: KPIData;
  profitMargin: KPIData;
  orders: KPIData;
  averageOrderValue: KPIData;
  returnRate: KPIData;
}

interface KPIGridProps {
  kpis: OverviewKPIs | null;
  isLoading: boolean;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis, isLoading }) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number | null) =>
    val !== null ? `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';
  const formatNumber = (val: number | null) =>
    val !== null ? val.toLocaleString('en-IN') : '—';
  const formatPercent = (val: number | null) =>
    val !== null ? `${val.toFixed(1)}%` : '—';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
      <KPIStatCard
        label="Revenue"
        value={formatCurrency(kpis.revenue.value)}
        deltaPercent={kpis.revenue.deltaPercent ?? undefined}
        deltaDirection={kpis.revenue.deltaDirection}
      />
      <KPIStatCard
        label="Estimated Profit"
        value={formatCurrency(kpis.estimatedProfit.value)}
        deltaPercent={kpis.estimatedProfit.deltaPercent ?? undefined}
        deltaDirection={kpis.estimatedProfit.deltaDirection}
      />
      <KPIStatCard
        label="Profit Margin"
        value={formatPercent(kpis.profitMargin.value)}
        deltaPercent={kpis.profitMargin.deltaPercent ?? undefined}
        deltaDirection={kpis.profitMargin.deltaDirection}
      />
      <KPIStatCard
        label="Total Orders"
        value={formatNumber(kpis.orders.value)}
        deltaPercent={kpis.orders.deltaPercent ?? undefined}
        deltaDirection={kpis.orders.deltaDirection}
      />
      <KPIStatCard
        label="Avg Order Value"
        value={formatCurrency(kpis.averageOrderValue.value)}
        deltaPercent={kpis.averageOrderValue.deltaPercent ?? undefined}
        deltaDirection={kpis.averageOrderValue.deltaDirection}
      />
      <KPIStatCard
        label="Merchant Return Rate"
        value={formatPercent(kpis.returnRate.value)}
        deltaPercent={kpis.returnRate.deltaPercent ?? undefined}
        deltaDirection={kpis.returnRate.deltaDirection}
        lowerIsBetter={true}
      />
    </div>
  );
};
