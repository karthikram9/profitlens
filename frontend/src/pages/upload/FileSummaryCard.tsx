import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export interface FileSummaryData {
  uploadId: string;
  originalFilename: string;
  marketplaceDetected: string | null;
  confidence: number | null;
  rowCountRaw: number;
  rowCountProcessed: number;
  rowCountExcluded: number;
  categoriesFound: string[];
  dateMin: string | null;
  dateMax: string | null;
}

interface FileSummaryCardProps {
  summary: FileSummaryData;
  onContinue: () => void;
  isReady: boolean;
}

export const FileSummaryCard: React.FC<FileSummaryCardProps> = ({ summary, onContinue, isReady }) => {
  return (
    <Card className="w-full">
      <div className="p-md md:p-lg border-b border-border">
        <div className="flex justify-between items-center mb-sm">
          <h2 className="text-lg font-semibold text-text-primary">Upload Summary</h2>
          {isReady ? (
            <Badge variant="success">Processing Complete</Badge>
          ) : (
            <Badge variant="warning">Processing...</Badge>
          )}
        </div>
        <p className="text-sm text-text-muted">
          Review the details of your processed data before continuing to the dashboard.
        </p>
      </div>

      <div className="p-md md:p-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Marketplace */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-xs">Marketplace</p>
          <div className="flex items-center gap-sm">
            <span className="text-base font-medium text-text-primary capitalize">
              {summary.marketplaceDetected || 'Unknown'}
            </span>
            {summary.confidence && summary.confidence >= 0.8 && (
               <Badge variant="success" className="text-[10px] px-2 py-0.5">High Confidence</Badge>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-xs">Date Range</p>
          <p className="text-base font-medium text-text-primary">
            {summary.dateMin && summary.dateMax
              ? `${summary.dateMin} to ${summary.dateMax}`
              : 'N/A'}
          </p>
        </div>

        {/* Rows Processed */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-xs">Rows Processed</p>
          <p className="text-base font-medium text-text-primary">
            {summary.rowCountProcessed.toLocaleString()} <span className="text-sm text-text-muted font-normal">/ {summary.rowCountRaw.toLocaleString()}</span>
          </p>
        </div>

        {/* Rows Excluded */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-xs">Rows Excluded</p>
           <p className="text-base font-medium text-text-primary">
            {summary.rowCountExcluded.toLocaleString()}
          </p>
        </div>
      </div>
      
      {summary.categoriesFound && summary.categoriesFound.length > 0 && (
        <div className="px-md md:px-lg pb-md md:pb-lg">
           <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-xs">Categories Found ({summary.categoriesFound.length})</p>
           <div className="flex flex-wrap gap-xs">
              {summary.categoriesFound.map(cat => (
                <span key={cat} className="px-2 py-1 bg-bg border border-border rounded text-xs text-text-secondary">
                  {cat}
                </span>
              ))}
           </div>
        </div>
      )}

      <div className="p-md md:p-lg border-t border-border bg-bg/50 flex justify-end">
        <Button
          variant="primary"
          onClick={onContinue}
          disabled={!isReady}
        >
          Continue to Dashboard
        </Button>
      </div>
    </Card>
  );
};
