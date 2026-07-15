import React from 'react';
import { Badge } from '../../components/ui/Badge';

export interface ExclusionReason {
  reason: string;
  count: number;
}

interface ValidationWarningsListProps {
  exclusions: ExclusionReason[];
  className?: string;
}

export const ValidationWarningsList: React.FC<ValidationWarningsListProps> = ({ exclusions, className = '' }) => {
  if (!exclusions || exclusions.length === 0) {
    return null; // Don't render anything if there are no warnings
  }

  return (
    <div className={`space-y-sm ${className}`}>
      <h3 className="text-sm font-semibold text-text-primary">Data Validation Notes</h3>
      <ul className="space-y-xs">
        {exclusions.map((exclusion, index) => (
          <li key={index} className="flex items-center gap-sm">
            <Badge variant="info">Note</Badge>
            <span className="text-sm text-text-secondary">
              <strong className="text-text-primary font-medium">{exclusion.count.toLocaleString()} rows</strong> excluded: {exclusion.reason.replace(/_/g, ' ')}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-muted mt-sm">
        These rows will not be included in your dashboard metrics. This is expected for things like cancelled orders or missing critical data.
      </p>
    </div>
  );
};
