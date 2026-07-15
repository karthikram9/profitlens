import React, { useEffect, useState, useCallback } from 'react';
import { useDashboard } from '../../../lib/dashboard-context';
import { apiRequest, ApiError } from '../../../lib/api-client';

import { ImpactStatCards } from '../components/ImpactStatCards';
import { CategoryProfitChart } from '../components/CategoryProfitChart';
import { ProfitMarginTable } from '../components/ProfitMarginTable';
import { CostBreakdownChart } from '../components/CostBreakdownChart';
import { MonthlyProfitTrendChart } from '../components/MonthlyProfitTrendChart';
import { ProductsTable } from '../components/ProductsTable';
import { InventoryOpportunityPanel } from '../components/InventoryOpportunityPanel';

import type { ProfitOverviewData } from '../types/profitAnalytics';

export const ProfitAnalyticsTab: React.FC = () => {
  const { currentUpload } = useDashboard();

  const [overviewData, setOverviewData] = useState<ProfitOverviewData | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [trendCategory, setTrendCategory] = useState('');
  const [trendData, setTrendData] = useState<ProfitOverviewData['monthlyTrend'] | null>(null);
  const [isTrendLoading, setIsTrendLoading] = useState(true);

  const [productsCategoryFilter, setProductsCategoryFilter] = useState<string | null>(null);

  const isReady = currentUpload?.status === 'ready';

  const fetchProfitOverview = useCallback(async (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiRequest<ProfitOverviewData>(`/analytics/profit-overview${params}`);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let isMounted = true;
    setIsOverviewLoading(true);
    setOverviewError(null);

    fetchProfitOverview()
      .then((res) => {
        if (isMounted) {
          setOverviewData(res);
          setTrendData(res.monthlyTrend);
          setIsOverviewLoading(false);
          setIsTrendLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const message = err instanceof ApiError
            ? err.message
            : 'Failed to load profit analytics';
          setOverviewError(message);
          setIsOverviewLoading(false);
          setIsTrendLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [isReady, fetchProfitOverview]);

  useEffect(() => {
    if (!isReady || !overviewData) return;

    if (!trendCategory) {
      setTrendData(overviewData.monthlyTrend);
      setIsTrendLoading(false);
      return;
    }

    let isMounted = true;
    setIsTrendLoading(true);

    fetchProfitOverview(trendCategory)
      .then((res) => {
        if (isMounted) {
          setTrendData(res.monthlyTrend);
          setIsTrendLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsTrendLoading(false);
      });

    return () => { isMounted = false; };
  }, [isReady, trendCategory, fetchProfitOverview, overviewData]);

  const handleCategorySelect = (category: string | null) => {
    setProductsCategoryFilter(category);
  };

  if (overviewError) {
    return (
      <div className="p-xl bg-danger/10 text-danger rounded-md border border-danger/20">
        <p className="font-bold">Error loading profit analytics</p>
        <p>{overviewError}</p>
      </div>
    );
  }

  const costBreakdown = overviewData?.costBreakdown ?? null;

  return (
    <div className="space-y-lg animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Profit Analytics</h2>
        <p className="text-text-secondary text-sm">
          Category and product-level profitability, cost structure, and inventory opportunities.
        </p>
      </div>

      <ImpactStatCards
        shippingPct={costBreakdown?.shippingCost.percentOfRevenue ?? null}
        platformFeePct={costBreakdown?.platformFee.percentOfRevenue ?? null}
        gstPct={costBreakdown?.gst.percentOfRevenue ?? null}
        isLoading={isOverviewLoading}
      />

      <CategoryProfitChart
        data={overviewData?.categoryPerformance ?? null}
        isLoading={isOverviewLoading}
        selectedCategory={productsCategoryFilter}
        onCategorySelect={handleCategorySelect}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <ProfitMarginTable
          data={overviewData?.categoryPerformance ?? null}
          isLoading={isOverviewLoading}
        />
        <CostBreakdownChart
          data={costBreakdown}
          isLoading={isOverviewLoading}
        />
      </div>

      <MonthlyProfitTrendChart
        data={trendData}
        categories={overviewData?.categoryPerformance ?? null}
        selectedCategory={trendCategory}
        onCategoryChange={setTrendCategory}
        isLoading={isOverviewLoading || isTrendLoading}
      />

      <ProductsTable
        categoryFilter={productsCategoryFilter}
        onClearCategoryFilter={() => setProductsCategoryFilter(null)}
        enabled={isReady}
      />

      <InventoryOpportunityPanel
        data={overviewData?.inventoryOpportunity ?? null}
        isLoading={isOverviewLoading}
      />
    </div>
  );
};
