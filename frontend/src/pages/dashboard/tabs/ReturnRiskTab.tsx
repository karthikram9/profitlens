import React, { useState, useEffect } from 'react';
import type { RiskOverviewResponse } from '../../../lib/api/analytics';
import { fetchRiskOverview } from '../../../lib/api/analytics';
import { NotScoredExplainer } from '../components/NotScoredExplainer';
import { RiskSummaryStatCards } from '../components/RiskSummaryStatCards';
import { RiskHeatmap } from '../components/RiskHeatmap';
import { TopRiskyCategoriesCard } from '../components/TopRiskyCategoriesCard';
import { TopRiskyStatesCard } from '../components/TopRiskyStatesCard';
import { HighRiskOrdersTable } from '../components/HighRiskOrdersTable';

export const ReturnRiskTab: React.FC = () => {
  const [overview, setOverview] = useState<RiskOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isSubscribed = true;
    setIsLoading(true);

    fetchRiskOverview()
      .then((res) => {
        if (isSubscribed) {
          setOverview(res);
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
  }, []);

  const handleSelectCell = (cat: string | undefined, st: string | undefined) => {
    setSelectedCategory(cat);
    setSelectedState(st);
  };

  return (
    <div className="space-y-lg">
      {/* Tab Header */}
      <div>
        <h2 className="text-2xl font-bold text-text font-sans tracking-tight">Return Risk Analytics</h2>
        <p className="text-sm text-text-muted mt-1">
          Predictive return-risk scoring for Merchant-fulfilled orders, category/state risk heatmaps, and high-risk order tracking.
        </p>
      </div>

      {/* Channel Scoping Explainer (Permanent Banner) */}
      <NotScoredExplainer />

      {/* Summary KPI Cards */}
      <RiskSummaryStatCards data={overview} isLoading={isLoading} />

      {/* Category x State Heatmap Grid */}
      <RiskHeatmap
        cells={overview?.heatmap || []}
        isLoading={isLoading}
        selectedCategory={selectedCategory}
        selectedState={selectedState}
        onSelectCell={handleSelectCell}
      />

      {/* Top Risky Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
        <TopRiskyCategoriesCard
          categories={overview?.topRiskyCategories || []}
          isLoading={isLoading}
        />
        <TopRiskyStatesCard
          states={overview?.topRiskyStates || []}
          isLoading={isLoading}
        />
      </div>

      {/* Paginated High Risk Orders Table */}
      <HighRiskOrdersTable
        initialCategory={selectedCategory}
        initialState={selectedState}
      />
    </div>
  );
};
