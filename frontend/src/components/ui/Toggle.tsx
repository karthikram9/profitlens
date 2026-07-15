import React from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(({
  className,
  label,
  helperText,
  error,
  id,
  checked,
  onChange,
  ...props
}, ref) => {
  const toggleId = id || React.useId();

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center gap-sm">
        <label htmlFor={toggleId} className="relative inline-flex items-center cursor-pointer select-none">
          <input
            ref={ref}
            id={toggleId}
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <div className={cn(
            "w-10 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary",
            error && 'peer-focus:ring-danger border-danger'
          )} />
          {label && (
            <span className="ml-sm text-sm font-medium text-text-primary">
              {label}
            </span>
          )}
        </label>
      </div>
      {error && (
        <span className="text-xs text-danger font-medium">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span className="text-xs text-text-muted">
          {helperText}
        </span>
      )}
    </div>
  );
});

Toggle.displayName = 'Toggle';
