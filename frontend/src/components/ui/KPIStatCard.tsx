import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

export interface KPIStatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  deltaPercent?: number;
  deltaDirection?: 'up' | 'down' | 'neutral';
  sparklineSlot?: React.ReactNode;
  className?: string;
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  label,
  value,
  unit,
  deltaPercent,
  deltaDirection = 'neutral',
  sparklineSlot,
  className,
}) => {
  const isUp = deltaDirection === 'up';
  const isDown = deltaDirection === 'down';
  const isNeutral = deltaDirection === 'neutral';

  return (
    <Card className={cn("p-md", className)}>
      <div className="flex flex-col gap-xs">
        <span className="text-sm font-semibold text-text-muted">
          {label}
        </span>
        <div className="flex items-baseline gap-xs">
          <span className="text-3xl font-bold text-text-primary tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-medium text-text-secondary ml-xs">
              {unit}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-sm min-h-[24px]">
          {deltaPercent !== undefined && (
            <div
              className={cn(
                "flex items-center text-xs font-bold px-sm py-[2px] rounded-full border",
                isUp && "bg-success-bg border-success/20 text-success",
                isDown && "bg-danger-bg border-danger/20 text-danger",
                isNeutral && "bg-bg border-border text-text-muted"
              )}
            >
              {isUp && <ArrowUpRight className="h-3 w-3 mr-[2px]" />}
              {isDown && <ArrowDownRight className="h-3 w-3 mr-[2px]" />}
              {isNeutral && <Minus className="h-3 w-3 mr-[2px]" />}
              <span>{Math.abs(deltaPercent)}%</span>
            </div>
          )}
          {sparklineSlot && <div className="flex-1 ml-lg">{sparklineSlot}</div>}
        </div>
      </div>
    </Card>
  );
};
export default KPIStatCard;
