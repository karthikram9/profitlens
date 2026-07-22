import React from 'react';
import type { RiskyStateRow } from '../../../lib/api/analytics';
import { Skeleton } from '../../../components/ui/Skeleton';
import { MapPin } from 'lucide-react';

interface TopRiskyStatesCardProps {
  states: RiskyStateRow[];
  isLoading: boolean;
}

export const TopRiskyStatesCard: React.FC<TopRiskyStatesCardProps> = ({
  states,
  isLoading,
}) => {
  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-lg flex flex-col justify-between h-full shadow-sm">
      <div>
        <div className="flex items-center justify-between mb-md">
          <h3 className="text-base font-semibold text-text font-sans">Top Risky States</h3>
          <MapPin className="w-5 h-5 text-warning" />
        </div>
        <p className="text-xs text-text-muted mb-md">
          Destination states with highest average return probability (min. 5 orders).
        </p>

        {(!states || states.length === 0) ? (
          <p className="text-sm text-text-muted py-md text-center">No states meet the sample threshold.</p>
        ) : (
          <div className="space-y-sm">
            {states.map((item) => (
              <div
                key={item.state}
                className="flex items-center justify-between p-sm rounded-lg bg-bg/50 border border-border/50"
              >
                <div>
                  <span className="text-sm font-medium text-text block">{item.state}</span>
                  <span className="text-xs text-text-muted">{item.orderCount} Merchant orders</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-warning">
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
