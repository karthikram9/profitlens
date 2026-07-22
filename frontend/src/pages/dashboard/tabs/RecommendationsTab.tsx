import React, { useState, useEffect } from 'react';
import type { RecommendationItem } from '../../../lib/api/analytics';
import { fetchRecommendations } from '../../../lib/api/analytics';
import { NotScoredExplainer } from '../components/NotScoredExplainer';
import { RecommendationsList } from '../components/RecommendationsList';

export const RecommendationsTab: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isSubscribed = true;
    setIsLoading(true);

    fetchRecommendations()
      .then((res) => {
        if (isSubscribed) {
          setRecommendations(res.recommendations);
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

  return (
    <div className="space-y-lg">
      {/* Tab Header */}
      <div>
        <h2 className="text-2xl font-bold text-text font-sans tracking-tight">Recommendations Engine</h2>
        <p className="text-sm text-text-muted mt-1">
          Rule-based actionable recommendations to reduce return losses and protect profit margins.
        </p>
      </div>

      {/* Channel Scoping Explainer (Permanent Banner) */}
      <NotScoredExplainer />

      {/* Recommendations Cards List */}
      <RecommendationsList recommendations={recommendations} isLoading={isLoading} />
    </div>
  );
};
