import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Select } from '../../../components/ui/Select';
import type { ProfitTrendPoint, CategoryProfitRow } from '../types/profitAnalytics';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface MonthlyProfitTrendChartProps {
  data: ProfitTrendPoint[] | null;
  categories: CategoryProfitRow[] | null;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isLoading: boolean;
}

export const MonthlyProfitTrendChart: React.FC<MonthlyProfitTrendChartProps> = ({
  data,
  categories,
  selectedCategory,
  onCategoryChange,
  isLoading,
}) => {
  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...(categories ?? []).map((c) => ({ value: c.category, label: c.category })),
  ];

  if (isLoading || !data) {
    return (
      <Card>
        <div className="h-80 flex flex-col gap-md">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="flex-1 w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  const chartData =
    data.length === 1
      ? [
          { period: 'Start', revenue: 0, profit: 0 },
          ...data,
          { period: 'End', revenue: data[0].revenue, profit: data[0].profit },
        ]
      : data;

  const formatYAxis = (val: number) => {
    if (val === 0) return '₹0';
    if (Math.abs(val) >= 1_000_000) return `₹${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `₹${(val / 1_000).toFixed(0)}K`;
    return `₹${val}`;
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-md mb-lg">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Monthly Profit Trend</h3>
          <p className="text-xs text-text-muted mt-xs">
            {selectedCategory ? `Filtered to ${selectedCategory}` : 'All categories combined'}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Category"
            options={categoryOptions}
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          />
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex flex-col justify-center items-center text-center">
          <p className="text-text-secondary font-medium mb-xs">No trend data available</p>
          <p className="text-sm text-text-muted">
            {selectedCategory
              ? 'No monthly data for this category.'
              : 'Not enough data to generate a trend chart.'}
          </p>
        </div>
      ) : (
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profitTrendRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitTrendProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                tickFormatter={formatYAxis}
                width={64}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  fontSize: 13,
                }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, undefined]}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#profitTrendRevenue)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Est. Profit"
                stroke="var(--color-success)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#profitTrendProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
