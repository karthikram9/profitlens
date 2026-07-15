import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Badge } from '../../../components/ui/Badge';

export interface ActivityRow {
  orderId: string;
  date: string | null;
  category: string | null;
  amount: number;
  status: string | null;
}

interface RecentActivityListProps {
  activity: ActivityRow[] | null;
  isLoading: boolean;
}

const statusVariant = (status: string | null): 'success' | 'danger' | 'warning' | 'neutral' => {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return 'danger';
  if (s.includes('return')) return 'warning';
  if (s.includes('ship') || s.includes('deliver')) return 'success';
  return 'neutral';
};

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activity, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-between items-center mb-md">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <Card>
        <p className="text-text-muted text-sm text-center py-lg">No recent activity available.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-primary mb-md">Recent Orders</h3>
      {/* Negative margin trick to make the table full-bleed inside Card's inner div */}
      <div className="-mx-lg -mb-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-bg text-xs text-text-muted uppercase tracking-wider border-t border-b border-border">
            <tr>
              <th className="px-lg py-sm font-semibold">Order ID</th>
              <th className="px-md py-sm font-semibold">Date</th>
              <th className="px-md py-sm font-semibold">Category</th>
              <th className="px-md py-sm font-semibold text-right">Amount</th>
              <th className="px-md py-sm font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activity.map((row) => (
              <tr
                key={row.orderId}
                className="hover:bg-bg/50 transition-colors duration-100"
              >
                <td className="px-lg py-sm font-medium text-text-primary truncate max-w-[160px]">
                  {row.orderId || '—'}
                </td>
                <td className="px-md py-sm text-text-secondary whitespace-nowrap">
                  {row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-md py-sm text-text-secondary capitalize">
                  {row.category || '—'}
                </td>
                <td className="px-md py-sm text-text-primary font-medium text-right whitespace-nowrap">
                  ₹{row.amount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-md py-sm text-center">
                  <Badge variant={statusVariant(row.status)}>
                    {row.status || 'Unknown'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
