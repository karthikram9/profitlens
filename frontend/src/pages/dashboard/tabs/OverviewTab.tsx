import React, { useEffect, useState } from 'react';
import { useDashboard } from '../../../lib/dashboard-context';
import { apiRequest } from '../../../lib/api-client';

import { KPIGrid } from '../components/KPIGrid';
import type { OverviewKPIs } from '../components/KPIGrid';

import { RevenueTrendChart } from '../components/RevenueTrendChart';
import type { TrendPoint } from '../components/RevenueTrendChart';

import { TopWorstCategoryCard } from '../components/TopWorstCategoryCard';
import type { CategoryPerformance } from '../components/TopWorstCategoryCard';

import { TopStateCard } from '../components/TopStateCard';
import type { StatePerformance } from '../components/TopStateCard';

import { RecentActivityList } from '../components/RecentActivityList';
import type { ActivityRow } from '../components/RecentActivityList';

import { InsightsPanel } from '../components/InsightsPanel';

interface OverviewData {
  kpis: OverviewKPIs;
  revenueTrend: TrendPoint[];
  topCategory: CategoryPerformance | null;
  worstCategory: CategoryPerformance | null;
  topState: StatePerformance | null;
  recentActivity: ActivityRow[];
  insights: string[];
}

export const OverviewTab: React.FC = () => {
  const { currentUpload } = useDashboard();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we have a ready upload
    if (currentUpload?.status !== 'ready') return;

    let isMounted = true;
    setIsLoading(true);

    apiRequest<OverviewData>('/analytics/overview')
      .then(res => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.error?.message || 'Failed to load overview data');
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [currentUpload]);

  if (error) {
    return (
      <div className="p-xl bg-danger/10 text-danger rounded-md border border-danger/20">
        <p className="font-bold">Error loading overview</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-lg animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Overview</h2>
        <p className="text-text-secondary text-sm">
          A high-level summary of your business performance.
        </p>
      </div>

      <InsightsPanel insights={data?.insights || null} isLoading={isLoading} />

      <KPIGrid kpis={data?.kpis || null} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Trend chart takes up 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <RevenueTrendChart data={data?.revenueTrend || null} isLoading={isLoading} />
        </div>
        
        {/* Category & State cards take up 1/3 width */}
        <div className="flex flex-col gap-lg">
          <div className="flex-1">
            <TopWorstCategoryCard 
              topCategory={data?.topCategory || null} 
              worstCategory={data?.worstCategory || null} 
              isLoading={isLoading} 
            />
          </div>
          <div className="h-48 shrink-0">
            <TopStateCard 
              topState={data?.topState || null} 
              isLoading={isLoading} 
            />
          </div>
        </div>
      </div>

      <RecentActivityList activity={data?.recentActivity || null} isLoading={isLoading} />
    </div>
  );
};
