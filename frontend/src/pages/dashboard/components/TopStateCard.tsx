import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { MapPin } from 'lucide-react';

export interface StatePerformance {
  name: string | null;
  revenue: number;
}

interface TopStateCardProps {
  topState: StatePerformance | null;
  isLoading: boolean;
}

export const TopStateCard: React.FC<TopStateCardProps> = ({ topState, isLoading }) => {
  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-lg" />;
  }

  const fmtCurrency = (val: number) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <Card>
      <div className="flex items-center gap-md">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MapPin size={20} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-xs">
            Top Region
          </p>
          {topState?.name ? (
            <>
              <p className="text-base font-bold text-text-primary capitalize truncate">
                {topState.name}
              </p>
              <p className="text-sm text-text-secondary">
                {fmtCurrency(topState.revenue)} revenue
              </p>
            </>
          ) : (
            <p className="text-sm text-text-muted">Not enough data</p>
          )}
        </div>
      </div>
    </Card>
  );
};
