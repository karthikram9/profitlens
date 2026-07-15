import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-sm py-xs text-xs font-semibold rounded-full border';
  
  const variants = {
    neutral: 'bg-bg border-border text-text-secondary',
    success: 'bg-success-bg border-success/20 text-success',
    warning: 'bg-warning-bg border-warning/20 text-warning',
    danger: 'bg-danger-bg border-danger/20 text-danger',
    info: 'bg-info-bg border-info/20 text-info',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};
