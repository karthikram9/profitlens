import React, { useState, useEffect } from 'react';
import type { RiskOrderRow, RiskOrdersResponse } from '../../../lib/api/analytics';
import { fetchRiskOrders } from '../../../lib/api/analytics';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Search, ArrowUpDown, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface HighRiskOrdersTableProps {
  initialCategory?: string;
  initialState?: string;
}

export const HighRiskOrdersTable: React.FC<HighRiskOrdersTableProps> = ({
  initialCategory,
  initialState,
}) => {
  const [data, setData] = useState<RiskOrdersResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [category, setCategory] = useState<string>(initialCategory || '');
  const [state, setState] = useState<string>(initialState || '');
  const [tier, setTier] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('riskProbability');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Synchronize heatmap selection props if updated
  useEffect(() => {
    setCategory(initialCategory || '');
    setState(initialState || '');
    setPage(1);
  }, [initialCategory, initialState]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch paginated data
  useEffect(() => {
    let isSubscribed = true;
    setIsLoading(true);

    fetchRiskOrders({
      page,
      pageSize,
      sortBy,
      sortOrder,
      search: debouncedSearch || undefined,
      category: category || undefined,
      state: state || undefined,
      tier: tier || undefined,
    })
      .then((res) => {
        if (isSubscribed) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [page, pageSize, sortBy, sortOrder, debouncedSearch, category, state, tier]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getTierBadge = (t: string) => {
    switch (t.toLowerCase()) {
      case 'high':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-border/50 text-text-muted border-border';
    }
  };

  const totalPages = data ? Math.ceil(data.totalRows / pageSize) : 1;

  return (
    <div className="bg-surface border border-border rounded-xl p-lg shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-md">
        <div>
          <h3 className="text-base font-semibold text-text font-sans">High Risk Orders Table</h3>
          <p className="text-xs text-text-muted">
            Individual Merchant-fulfilled orders scored by the XGBoost return risk model.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-sm">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Order ID, Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-primary w-48"
            />
          </div>

          {/* Tier Filter */}
          <select
            value={tier}
            onChange={(e) => {
              setTier(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-primary"
          >
            <option value="">All Risk Tiers</option>
            <option value="high">High Risk (&ge; 50%)</option>
            <option value="medium">Medium Risk (20-50%)</option>
            <option value="low">Low Risk (&lt; 20%)</option>
          </select>

          {/* Clear Category/State filters if active */}
          {(category || state || tier || search) && (
            <button
              onClick={() => {
                setCategory('');
                setState('');
                setTier('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg/40">
              <th className="p-3 font-semibold text-text-muted">Order ID</th>
              <th
                onClick={() => handleSort('category')}
                className="p-3 font-semibold text-text-muted cursor-pointer hover:text-text"
              >
                <div className="flex items-center gap-1">
                  Category
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('amount')}
                className="p-3 font-semibold text-text-muted cursor-pointer hover:text-text"
              >
                <div className="flex items-center gap-1">
                  Amount
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('shipState')}
                className="p-3 font-semibold text-text-muted cursor-pointer hover:text-text"
              >
                <div className="flex items-center gap-1">
                  Ship State
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('riskProbability')}
                className="p-3 font-semibold text-text-muted cursor-pointer hover:text-text"
              >
                <div className="flex items-center gap-1">
                  Risk Probability
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="p-3 font-semibold text-text-muted">Tier</th>
              <th className="p-3 font-semibold text-text-muted">Confidence / Notes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td colSpan={7} className="p-3">
                    <Skeleton className="h-6 w-full rounded" />
                  </td>
                </tr>
              ))
            ) : !data || data.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-muted">
                  No orders match the selected risk criteria.
                </td>
              </tr>
            ) : (
              data.rows.map((row: RiskOrderRow) => (
                <tr key={row.id} className="border-b border-border/40 hover:bg-bg/20 transition-colors">
                  <td className="p-3 font-mono font-medium text-text">{row.orderId || 'N/A'}</td>
                  <td className="p-3 text-text">{row.category || '—'}</td>
                  <td className="p-3 font-mono text-text">₹{row.amount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-text-muted">{row.shipState || '—'}</td>
                  <td className="p-3 font-mono font-bold text-text">
                    {row.riskProbability !== null ? `${(row.riskProbability * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTierBadge(
                        row.riskTier
                      )}`}
                    >
                      {row.riskTier} Risk
                    </span>
                  </td>
                  <td className="p-3">
                    {row.usedFallback ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-warning/15 text-warning border border-warning/30">
                        <AlertTriangle className="w-3 h-3" />
                        Low confidence — unfamiliar category/state
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-muted">Standard</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data && data.totalRows > 0 && (
        <div className="flex items-center justify-between mt-md text-xs text-text-muted border-t border-border/50 pt-md">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.totalRows)} of {data.totalRows} orders
          </div>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg border border-border hover:bg-bg/60 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-lg border border-border hover:bg-bg/60 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
