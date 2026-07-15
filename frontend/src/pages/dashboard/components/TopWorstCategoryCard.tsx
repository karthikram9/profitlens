import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface CategoryPerformance {
  name: string | null;
  profit: number;
}

interface TopWorstCategoryCardProps {
  topCategory: CategoryPerformance | null;
  worstCategory: CategoryPerformance | null;
  isLoading: boolean;
}

export const TopWorstCategoryCard: React.FC<TopWorstCategoryCardProps> = ({
  topCategory,
  worstCategory,
  isLoading,
}) => {
  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  const fmtCurrency = (val: number) =>
    `₹${Math.abs(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex flex-col h-full gap-md">
      {/* Best Performer */}
      <Card>
        <div className="flex items-start gap-md">
          <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-xs">
              Best Performer
            </p>
            {topCategory?.name ? (
              <>
                <p className="text-base font-bold text-text-primary capitalize truncate">
                  {topCategory.name}
                </p>
                <p className="text-sm font-medium text-success">
                  +{fmtCurrency(topCategory.profit)} profit
                </p>
              </>
            ) : (
              <p className="text-sm text-text-muted">Not enough data</p>
            )}
          </div>
        </div>
      </Card>

      {/* Worst Performer */}
      <Card>
        <div className="flex items-start gap-md">
          <div className="w-9 h-9 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={18} className="text-danger" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-xs">
              Needs Attention
            </p>
            {worstCategory?.name ? (
              <>
                <p className="text-base font-bold text-text-primary capitalize truncate">
                  {worstCategory.name}
                </p>
                <p
                  className={`text-sm font-medium ${
                    worstCategory.profit < 0 ? 'text-danger' : 'text-warning'
                  }`}
                >
                  {worstCategory.profit < 0 ? '-' : '+'}
                  {fmtCurrency(worstCategory.profit)} profit
                </p>
              </>
            ) : (
              <p className="text-sm text-text-muted">Not enough data</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
