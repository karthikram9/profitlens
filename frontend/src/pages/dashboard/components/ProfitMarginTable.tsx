import React, { useMemo, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import type { CategoryProfitRow } from '../types/profitAnalytics';
import type { SortOrder } from '../types/profitAnalytics';

type SortColumn = 'category' | 'revenue' | 'profit' | 'marginPercent' | 'orders';

interface ProfitMarginTableProps {
  data: CategoryProfitRow[] | null;
  isLoading: boolean;
}

export const ProfitMarginTable: React.FC<ProfitMarginTableProps> = ({ data, isLoading }) => {
  const [sortBy, setSortBy] = useState<SortColumn>('profit');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedData = useMemo(() => {
    if (!data) return [];
    const rows = [...data];
    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
        case 'revenue':
          cmp = a.revenue - b.revenue;
          break;
        case 'profit':
          cmp = a.profit - b.profit;
          break;
        case 'marginPercent':
          cmp = a.marginPercent - b.marginPercent;
          break;
        case 'orders':
          cmp = a.orders - b.orders;
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [data, sortBy, sortOrder]);

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (isLoading || !data) {
    return (
      <Card>
        <Skeleton className="h-6 w-48 mb-lg" />
        <div className="space-y-sm">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-md">Category Margins</h3>
        <p className="text-sm text-text-muted">No category data to display.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-primary mb-lg">Category Margins</h3>
      <Table>
        <TableHeader>
          <TableRow hoverable={false}>
            <TableHead
              sortDirection={sortBy === 'category' ? sortOrder : null}
              onSort={() => handleSort('category')}
            >
              Category
            </TableHead>
            <TableHead
              sortDirection={sortBy === 'revenue' ? sortOrder : null}
              onSort={() => handleSort('revenue')}
              className="text-right"
            >
              Revenue
            </TableHead>
            <TableHead
              sortDirection={sortBy === 'profit' ? sortOrder : null}
              onSort={() => handleSort('profit')}
              className="text-right"
            >
              Profit
            </TableHead>
            <TableHead
              sortDirection={sortBy === 'marginPercent' ? sortOrder : null}
              onSort={() => handleSort('marginPercent')}
              className="text-right"
            >
              Margin %
            </TableHead>
            <TableHead
              sortDirection={sortBy === 'orders' ? sortOrder : null}
              onSort={() => handleSort('orders')}
              className="text-right"
            >
              Orders
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.category}>
              <TableCell className="font-medium">{row.category}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(row.revenue)}</TableCell>
              <TableCell
                className={`text-right tabular-nums ${row.profit < 0 ? 'text-danger font-semibold' : ''}`}
              >
                {formatCurrency(row.profit)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.marginPercent.toFixed(1)}%</TableCell>
              <TableCell className="text-right tabular-nums">{row.orders.toLocaleString('en-IN')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
