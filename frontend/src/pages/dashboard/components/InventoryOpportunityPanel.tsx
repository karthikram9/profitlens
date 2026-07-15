import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import type { InventoryOpportunity } from '../types/profitAnalytics';

interface InventoryOpportunityPanelProps {
  data: InventoryOpportunity | null;
  isLoading: boolean;
}

export const InventoryOpportunityPanel: React.FC<InventoryOpportunityPanelProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading || !data) {
    return (
      <Card>
        <div className="flex items-center gap-sm mb-md">
          <Package size={18} className="text-primary" />
          <div className="h-5 w-40 bg-border/60 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="space-y-sm">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <div className="space-y-sm">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const hasIncrease = data.increaseCandidates.length > 0;
  const hasReview = data.reviewCandidates.length > 0;

  if (!hasIncrease && !hasReview) {
    return (
      <Card>
        <div className="flex items-center gap-sm mb-md">
          <Package size={18} className="text-primary" />
          <h3 className="font-semibold text-text-primary">Inventory Opportunities</h3>
        </div>
        <p className="text-sm text-text-muted">
          No inventory recommendations at this time. Upload more data to unlock insights.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-sm mb-lg">
        <Package size={18} className="text-primary" />
        <h3 className="font-semibold text-text-primary">Inventory Opportunities</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <div className="flex items-center gap-sm mb-md">
            <TrendingUp size={16} className="text-success" />
            <h4 className="text-sm font-semibold text-text-primary">Increase Inventory</h4>
          </div>
          {hasIncrease ? (
            <ul className="space-y-sm">
              {data.increaseCandidates.map((candidate) => (
                <li
                  key={candidate.name}
                  className="flex items-start gap-sm text-sm p-sm rounded-md bg-success-bg border border-success/20"
                >
                  <TrendingUp size={14} className="text-success mt-[2px] flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-text-primary">{candidate.name}</span>
                    <p className="text-text-secondary mt-xs">{candidate.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No increase candidates identified.</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-sm mb-md">
            <AlertTriangle size={16} className="text-danger" />
            <h4 className="text-sm font-semibold text-text-primary">Review / Discontinue</h4>
          </div>
          {hasReview ? (
            <ul className="space-y-sm">
              {data.reviewCandidates.map((candidate) => (
                <li
                  key={candidate.name}
                  className="flex items-start gap-sm text-sm p-sm rounded-md bg-danger-bg border border-danger/20"
                >
                  <AlertTriangle size={14} className="text-danger mt-[2px] flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-text-primary">{candidate.name}</span>
                    <p className="text-text-secondary mt-xs">{candidate.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No review candidates identified.</p>
          )}
        </div>
      </div>
    </Card>
  );
};
