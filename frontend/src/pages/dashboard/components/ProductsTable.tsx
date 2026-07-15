import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { apiRequest } from '../../../lib/api-client';
import type { ProductsData, ProductsSortBy, SortOrder } from '../types/profitAnalytics';

interface ProductsTableProps {
  categoryFilter: string | null;
  onClearCategoryFilter: () => void;
  enabled: boolean;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  categoryFilter,
  onClearCategoryFilter,
  enabled,
}) => {
  const [data, setData] = useState<ProductsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<ProductsSortBy>('profit');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, debouncedSearch, sortBy, sortOrder, pageSize]);

  const fetchProducts = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortOrder,
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (categoryFilter) params.set('category', categoryFilter);

    try {
      const result = await apiRequest<ProductsData>(`/analytics/products?${params.toString()}`);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, page, pageSize, sortBy, sortOrder, debouncedSearch, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSort = (column: ProductsSortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const totalPages = data ? Math.max(1, Math.ceil(data.totalRows / data.pageSize)) : 1;

  if (!enabled) return null;

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md mb-lg">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Products</h3>
          {categoryFilter && (
            <div className="flex items-center gap-sm mt-xs">
              <Badge variant="info">Filtered: {categoryFilter}</Badge>
              <button
                type="button"
                onClick={onClearCategoryFilter}
                className="text-xs font-semibold text-primary hover:text-primary-hover"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-md p-md bg-danger/10 text-danger rounded-md border border-danger/20 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-sm">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <p className="text-sm text-text-muted py-lg text-center">
          {debouncedSearch || categoryFilter
            ? 'No products match your filters.'
            : 'No product data available.'}
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead
                  sortDirection={sortBy === 'unitsSold' ? sortOrder : null}
                  onSort={() => handleSort('unitsSold')}
                  className="text-right"
                >
                  Units Sold
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={`${row.sku}-${row.category}`}>
                  <TableCell className="font-medium">{row.sku}</TableCell>
                  <TableCell className="text-text-secondary">{row.category ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.unitsSold.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(row.revenue)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${
                      row.profit < 0 ? 'text-danger font-semibold' : ''
                    }`}
                  >
                    {formatCurrency(row.profit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.marginPercent.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md mt-lg pt-lg border-t border-border">
            <p className="text-sm text-text-muted">
              Showing {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.totalRows)} of {data.totalRows} products
            </p>
            <div className="flex items-center gap-md">
              <div className="w-28">
                <Select
                  options={[
                    { value: '10', label: '10 / page' },
                    { value: '20', label: '20 / page' },
                    { value: '50', label: '50 / page' },
                  ]}
                  value={String(pageSize)}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-sm">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-text-secondary tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
