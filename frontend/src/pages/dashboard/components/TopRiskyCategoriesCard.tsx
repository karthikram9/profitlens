import React from 'react';
import type { RiskyCategoryRow } from '../../../lib/api/analytics';
import { Skeleton } from '../../../components/ui/Skeleton';
import { AlertCircle } from 'lucide-react';

interface TopRiskyCategoriesCardProps {
  categories: RiskyCategoryRow[];
  isLoading: boolean;
}

export const TopRiskyCategoriesCard: React.FC<TopRiskyCategoriesCardProps> = ({
  categories,
  isLoading,
}) => {
  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-lg flex flex-col justify-between h-full shadow-sm">
      <div>
        <div className="flex items-center justify-between mb-md">
          <h3 className="text-base font-semibold text-text font-sans">Top Risky Categories</h3>
          <AlertCircle className="w-5 h-5 text-danger" />
        </div>
        <p className="text-xs text-text-muted mb-md">
          Categories with highest average predicted return probability (min. 5 orders).
        </p>

        {(!categories || categories.length === 0) ? (
          <p className="text-sm text-text-muted py-md text-center">No categories meet the sample threshold.</p>
        ) : (
          <div className="space-y-sm">
            {categories.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between p-sm rounded-lg bg-bg/50 border border-border/50"
              >
                <div>
                  <span className="text-sm font-medium text-text block">{item.category}</span>
                  <span className="text-xs text-text-muted">{item.orderCount} Merchant orders</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-danger">
                    {(item.avgRisk * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-text-muted block">avg risk</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
