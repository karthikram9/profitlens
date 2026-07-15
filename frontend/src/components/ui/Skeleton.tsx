import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-border/60", className)}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-surface border border-border rounded-lg p-lg shadow-sm space-y-md">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-3 w-3/4" />
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <div className="flex gap-md py-md border-b border-border items-center">
    {Array.from({ length: cols }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4",
          i === 0 ? "w-1/4" : i === 1 ? "w-1/6" : "w-12",
          "flex-grow"
        )}
      />
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-surface border border-border rounded-lg p-lg shadow-sm space-y-lg">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-1/4" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="h-64 flex items-end gap-sm pt-md">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1"
          style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }}
        />
      ))}
    </div>
  </div>
);
