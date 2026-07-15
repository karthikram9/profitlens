import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { CostBreakdown } from '../types/profitAnalytics';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';

interface CostBreakdownChartProps {
  data: CostBreakdown | null;
  isLoading: boolean;
}

const SEGMENTS = [
  { key: 'cogs' as const, label: 'COGS', color: 'var(--color-primary)' },
  { key: 'platformFee' as const, label: 'Platform Fee', color: 'var(--color-secondary)' },
  { key: 'shippingCost' as const, label: 'Shipping', color: 'var(--color-warning)' },
  { key: 'gst' as const, label: 'GST', color: 'var(--color-info)' },
  { key: 'returnLoss' as const, label: 'Return Loss', color: 'var(--color-danger)' },
];

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <Card>
        <div className="h-80 flex flex-col gap-md">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="flex-1 w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  const chartData = SEGMENTS.map((seg) => ({
    name: seg.label,
    value: data[seg.key].value,
    percent: data[seg.key].percentOfRevenue,
    color: seg.color,
  })).filter((item) => item.value > 0);

  const totalCost = chartData.reduce((sum, item) => sum + item.value, 0);

  if (totalCost === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-md">Cost Breakdown</h3>
        <p className="text-sm text-text-muted">No cost data available for this upload.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-primary mb-lg">Cost Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg items-center">
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  fontSize: 13,
                }}
                formatter={(value: any, _name: any, props: any) => [
                  `₹${Number(value).toLocaleString('en-IN')} (${(props.payload?.percent ?? 0).toFixed(1)}%)`,
                  undefined,
                ]}
              />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-sm">
          {SEGMENTS.map((seg) => {
            const item = data[seg.key];
            return (
              <div key={seg.key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-sm">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-text-secondary">{seg.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-text-primary tabular-nums">
                    ₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-text-muted ml-sm tabular-nums">
                    {item.percentOfRevenue.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
