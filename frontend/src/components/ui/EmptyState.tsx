import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-2xl text-center bg-surface border border-dashed border-border rounded-lg shadow-sm">
      {Icon && (
        <div className="p-md bg-bg rounded-full text-text-muted mb-md">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      )}
      <h3 className="text-lg font-bold text-text-primary mb-xs">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-lg">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
