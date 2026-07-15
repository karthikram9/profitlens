import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { CategoryProfitRow } from '../types/profitAnalytics';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface CategoryProfitChartProps {
  data: CategoryProfitRow[] | null;
  isLoading: boolean;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

export const CategoryProfitChart: React.FC<CategoryProfitChartProps> = ({
  data,
  isLoading,
  selectedCategory,
  onCategorySelect,
}) => {
  if (isLoading || !data) {
    return (
      <Card>
        <div className="h-96 flex flex-col gap-md">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="flex-1 w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <div className="h-96 flex flex-col justify-center items-center text-center">
          <p className="text-text-secondary font-medium mb-xs">No category data available</p>
          <p className="text-sm text-text-muted">Upload order data to see category profitability.</p>
        </div>
      </Card>
    );
  }

  const chartData = data.map((row) => ({
    category: row.category,
    revenue: row.revenue,
    profit: row.profit,
  }));

  const formatYAxis = (val: number) => {
    if (val === 0) return '₹0';
    if (Math.abs(val) >= 1_000_000) return `₹${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `₹${(val / 1_000).toFixed(0)}K`;
    return `₹${val}`;
  };

  const handleBarClick = (entry: { category?: string }) => {
    if (!entry?.category) return;
    onCategorySelect(selectedCategory === entry.category ? null : entry.category);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Category Profitability</h3>
          <p className="text-xs text-text-muted mt-xs">Click a bar to filter the products table</p>
        </div>
        {selectedCategory && (
          <button
            type="button"
            onClick={() => onCategorySelect(null)}
            className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors duration-fast"
          >
            Clear filter
          </button>
        )}
      </div>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 0, bottom: 48 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={60}
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
              formatter={(value: any, name: any) => [
                `₹${Number(value).toLocaleString('en-IN')}`,
                name === 'revenue' ? 'Revenue' : 'Profit',
              ]}
            />
            <Legend verticalAlign="top" height={32} iconType="circle" />
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill="var(--color-primary)"
              opacity={0.85}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(_, index) => handleBarClick(chartData[index])}
            />
            <Bar
              dataKey="profit"
              name="Est. Profit"
              fill="var(--color-success)"
              opacity={selectedCategory ? 0.6 : 0.85}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(_, index) => handleBarClick(chartData[index])}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
