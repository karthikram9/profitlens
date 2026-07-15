import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  interactive = false,
  headerSlot,
  footerSlot,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-lg shadow-sm overflow-hidden transition-all duration-base',
        interactive && 'hover:shadow-md hover:border-primary-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {headerSlot && (
        <div className="px-lg py-md border-b border-border bg-surface">
          {headerSlot}
        </div>
      )}
      <div className="p-lg">
        {children}
      </div>
      {footerSlot && (
        <div className="px-lg py-md border-t border-border bg-bg/50">
          {footerSlot}
        </div>
      )}
    </div>
  );
};
