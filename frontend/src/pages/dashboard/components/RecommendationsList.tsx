import React from 'react';
import type { RecommendationItem } from '../../../lib/api/analytics';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Lightbulb, AlertTriangle, TrendingUp, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';

interface RecommendationsListProps {
  recommendations: RecommendationItem[];
  isLoading: boolean;
}

export const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-md">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-xl text-center shadow-sm">
        <Lightbulb className="w-8 h-8 text-primary mx-auto mb-sm opacity-60" />
        <h4 className="text-base font-semibold text-text mb-xs font-sans">No Elevated Return Risk Categories Detected</h4>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          All categories are currently operating within standard risk parameters (no category exceeds the store average return risk by &ge; 5 percentage points with sufficient order volume).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {recommendations.map((rec) => {
        const isHigh = rec.priority === 'High';

        return (
          <div
            key={rec.id}
            className={`bg-surface border rounded-xl p-lg shadow-sm transition-all ${
              isHigh ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-md mb-md pb-sm border-b border-border/40">
              <div className="flex items-center gap-sm">
                <span
                  className={`p-2 rounded-lg ${
                    isHigh ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                  }`}
                >
                  <Lightbulb className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-text font-sans">{rec.category}</h3>
                  <span className="text-xs text-text-muted">Rule-based actionable insight</span>
                </div>
              </div>

              {/* Priority badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isHigh
                    ? 'bg-danger/15 text-danger border-danger/30'
                    : 'bg-warning/15 text-warning border-warning/30'
                }`}
              >
                {rec.priority} Priority
              </span>
            </div>

            {/* 6 Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md text-xs">
              {/* Field 1: Reason */}
              <div className="bg-surface/80 border border-border/50 rounded-lg p-md">
                <div className="flex items-center gap-1.5 font-semibold text-text mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                  <span>1. Reason for Recommendation</span>
                </div>
                <p className="text-text-muted leading-relaxed">{rec.reason}</p>
              </div>

              {/* Field 2: Evidence */}
              <div className="bg-surface/80 border border-border/50 rounded-lg p-md">
                <div className="flex items-center gap-1.5 font-semibold text-text mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>2. Scored Evidence</span>
                </div>
                <p className="text-text-muted leading-relaxed">{rec.evidence}</p>
              </div>

              {/* Field 3: Business Impact */}
              <div className="bg-surface/80 border border-border/50 rounded-lg p-md">
                <div className="flex items-center gap-1.5 font-semibold text-text mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-danger shrink-0" />
                  <span>3. Historical Business Impact</span>
                </div>
                <p className="text-text-muted leading-relaxed font-mono font-medium">{rec.businessImpact}</p>
              </div>

              {/* Field 4: Expected Improvement */}
              <div className="bg-surface/80 border border-border/50 rounded-lg p-md">
                <div className="flex items-center gap-1.5 font-semibold text-text mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>4. Expected Financial Improvement</span>
                </div>
                <p className="text-success font-medium leading-relaxed font-mono">{rec.expectedImprovement}</p>
              </div>

              {/* Field 5 & 6: Suggested Action */}
              <div className="md:col-span-2 bg-primary/10 border border-primary/20 rounded-lg p-md">
                <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                  <ArrowRight className="w-4 h-4 shrink-0" />
                  <span>5. Suggested Seller Action</span>
                </div>
                <p className="text-text font-medium leading-relaxed">{rec.suggestedAction}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
