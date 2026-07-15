import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { KPIStatCard } from '../../../components/ui/KPIStatCard';

interface ImpactStatCardsProps {
  shippingPct: number | null;
  platformFeePct: number | null;
  gstPct: number | null;
  isLoading: boolean;
}

export const ImpactStatCards: React.FC<ImpactStatCardsProps> = ({
  shippingPct,
  platformFeePct,
  gstPct,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
      <KPIStatCard
        label="Shipping Cost"
        value={`${(shippingPct ?? 0).toFixed(1)}%`}
        unit="of revenue"
        deltaDirection="neutral"
      />
      <KPIStatCard
        label="Platform Fee"
        value={`${(platformFeePct ?? 0).toFixed(1)}%`}
        unit="of revenue"
        deltaDirection="neutral"
      />
      <KPIStatCard
        label="GST"
        value={`${(gstPct ?? 0).toFixed(1)}%`}
        unit="of revenue"
        deltaDirection="neutral"
      />
    </div>
  );
};
