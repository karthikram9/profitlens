import React from 'react';
import type { RiskOverviewResponse } from '../../../lib/api/analytics';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ShieldAlert, AlertTriangle, ShieldCheck, Percent, HelpCircle } from 'lucide-react';

interface RiskSummaryStatCardsProps {
  data: RiskOverviewResponse | null;
  isLoading: boolean;
}

export const RiskSummaryStatCards: React.FC<RiskSummaryStatCardsProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-md mb-xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const { tierCounts, avgRiskProbability, scoredOrderCount, unscoredOrderCount } = data;
  const totalScored = scoredOrderCount || 1; // avoid divide by zero

  const highPct = (tierCounts.high / totalScored * 100).toFixed(1);
  const medPct = (tierCounts.medium / totalScored * 100).toFixed(1);
  const lowPct = (tierCounts.low / totalScored * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-md mb-xl">
      {/* High Risk Card */}
      <div className="bg-surface border border-border rounded-xl p-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-muted">High Risk Tier</span>
          <span className="p-1.5 rounded-lg bg-danger/10 text-danger">
            <ShieldAlert className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-danger">{tierCounts.high}</div>
          <div className="text-xs text-text-muted mt-0.5">{highPct}% of scored orders</div>
        </div>
      </div>

      {/* Medium Risk Card */}
      <div className="bg-surface border border-border rounded-xl p-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-muted">Medium Risk Tier</span>
          <span className="p-1.5 rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-warning">{tierCounts.medium}</div>
          <div className="text-xs text-text-muted mt-0.5">{medPct}% of scored orders</div>
        </div>
      </div>

      {/* Low Risk Card */}
      <div className="bg-surface border border-border rounded-xl p-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-muted">Low Risk Tier</span>
          <span className="p-1.5 rounded-lg bg-success/10 text-success">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-success">{tierCounts.low}</div>
          <div className="text-xs text-text-muted mt-0.5">{lowPct}% of scored orders</div>
        </div>
      </div>

      {/* Avg Risk Probability Card */}
      <div className="bg-surface border border-border rounded-xl p-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-muted">Avg Risk Probability</span>
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Percent className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-text">
            {(avgRiskProbability * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-text-muted mt-0.5">Across all Merchant orders</div>
        </div>
      </div>

      {/* Scored vs Unscored Card */}
      <div className="bg-surface border border-border rounded-xl p-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-muted">Scored vs Unscored</span>
          <span className="p-1.5 rounded-lg bg-border/50 text-text-muted">
            <HelpCircle className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-text">{scoredOrderCount}</div>
          <div className="text-xs text-text-muted mt-0.5">
            {unscoredOrderCount} unscored (Amazon FBA)
          </div>
        </div>
      </div>
    </div>
  );
};
