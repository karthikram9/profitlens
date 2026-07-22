import React from 'react';
import type { HeatmapCell } from '../../../lib/api/analytics';
import { Skeleton } from '../../../components/ui/Skeleton';

interface RiskHeatmapProps {
  cells: HeatmapCell[];
  isLoading: boolean;
  selectedCategory?: string;
  selectedState?: string;
  onSelectCell: (category: string | undefined, state: string | undefined) => void;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({
  cells,
  isLoading,
  selectedCategory,
  selectedState,
  onSelectCell,
}) => {
  if (isLoading) {
    return <Skeleton className="h-80 w-full rounded-xl mb-xl" />;
  }

  if (!cells || cells.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-lg text-center text-text-muted mb-xl">
        No Merchant order risk data available to populate heatmap.
      </div>
    );
  }

  // Get unique categories and states sorted
  const categories = Array.from(new Set(cells.map((c) => c.category))).sort();
  const states = Array.from(new Set(cells.map((c) => c.state))).sort();

  // Map (category, state) -> cell data
  const cellMap = new Map<string, HeatmapCell>();
  cells.forEach((cell) => {
    cellMap.set(`${cell.category}___${cell.state}`, cell);
  });

  const getCellBg = (cell: HeatmapCell | undefined, isSelected: boolean) => {
    if (!cell || cell.insufficientData) {
      return 'bg-border/30 text-text-muted cursor-not-allowed border-dashed';
    }
    const val = cell.avgRisk;
    let baseBg = '';
    if (val >= 0.5) {
      baseBg = 'bg-danger/20 hover:bg-danger/30 text-danger border-danger/30';
    } else if (val >= 0.2) {
      baseBg = 'bg-warning/20 hover:bg-warning/30 text-warning border-warning/30';
    } else {
      baseBg = 'bg-success/20 hover:bg-success/30 text-success border-success/30';
    }
    return isSelected ? `${baseBg} ring-2 ring-primary ring-offset-2 ring-offset-surface font-bold` : baseBg;
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-lg mb-xl shadow-sm">
      <div className="flex items-center justify-between mb-md">
        <div>
          <h3 className="text-base font-semibold text-text font-sans">Return Risk Heatmap</h3>
          <p className="text-xs text-text-muted">
            Average return-risk probability by Category and State. Click a valid cell to filter the orders table below.
          </p>
        </div>
        {(selectedCategory || selectedState) && (
          <button
            onClick={() => onSelectCell(undefined, undefined)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Clear Heatmap Filter ({selectedCategory || 'All'} / {selectedState || 'All'})
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-md text-xs text-text-muted mb-md">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-danger/30 border border-danger/40" />
          <span>High Risk (≥ 50%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-warning/30 border border-warning/40" />
          <span>Medium Risk (20–50%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-success/30 border border-success/40" />
          <span>Low Risk (&lt; 20%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-border/40 border border-border/60 border-dashed" />
          <span>Insufficient Data (&lt; 5 orders)</span>
        </div>
      </div>

      {/* Grid table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr>
              <th className="p-2 border border-border bg-bg/50 font-semibold text-text-muted">Category \ State</th>
              {states.map((st) => (
                <th key={st} className="p-2 border border-border bg-bg/50 font-semibold text-text-muted text-center min-w-[90px]">
                  {st}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat}>
                <td className="p-2 border border-border font-medium text-text bg-bg/30">{cat}</td>
                {states.map((st) => {
                  const cell = cellMap.get(`${cat}___${st}`);
                  const isSelected = selectedCategory === cat && selectedState === st;
                  const isInsufficient = !cell || cell.insufficientData;

                  return (
                    <td
                      key={st}
                      title={
                        isInsufficient
                          ? 'Insufficient data (< 5 orders)'
                          : `${cat} in ${st}: ${(cell.avgRisk * 100).toFixed(1)}% avg risk (${cell.orderCount} orders)`
                      }
                      onClick={() => {
                        if (!isInsufficient) {
                          onSelectCell(
                            isSelected ? undefined : cat,
                            isSelected ? undefined : st
                          );
                        }
                      }}
                      className={`p-2 border border-border text-center transition-all ${getCellBg(
                        cell,
                        isSelected
                      )}`}
                    >
                      {isInsufficient ? (
                        <span className="text-[10px] opacity-60 font-mono">N/A</span>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="font-bold font-mono">{(cell.avgRisk * 100).toFixed(0)}%</span>
                          <span className="text-[9px] opacity-75 font-mono">{cell.orderCount} ord</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
