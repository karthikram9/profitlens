import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Lightbulb, Info } from 'lucide-react';

interface InsightsPanelProps {
  insights: string[] | null;
  isLoading: boolean;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-sm mb-md">
          <Lightbulb size={18} className="text-primary" />
          <div className="h-5 w-28 bg-border/60 rounded animate-pulse" />
        </div>
        <div className="space-y-sm">
          {[80, 95, 70].map((w, i) => (
            <Skeleton key={i} className={`h-5 w-${w === 80 ? '4/5' : w === 95 ? 'full' : '3/4'}`} />
          ))}
        </div>
      </Card>
    );
  }

  if (!insights || insights.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center gap-sm mb-md">
        <Lightbulb size={18} className="text-primary" />
        <h3 className="font-semibold text-text-primary">Key Insights</h3>
      </div>
      <ul className="space-y-sm">
        {insights.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-sm text-sm text-text-secondary">
            <Info size={15} className="text-primary mt-[2px] flex-shrink-0" />
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
