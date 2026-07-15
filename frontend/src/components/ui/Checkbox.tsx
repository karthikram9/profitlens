import React from 'react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({
  className,
  label,
  helperText,
  error,
  id,
  ...props
}, ref) => {
  const checkboxId = id || React.useId();

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-start gap-sm">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            'h-4 w-4 mt-1 rounded border-border text-primary focus:ring-primary cursor-pointer transition-all duration-base',
            error ? 'border-danger focus:ring-danger' : 'border-border focus:ring-primary',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium text-text-primary cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
      {error && (
        <span className="text-xs text-danger font-medium ml-6">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span className="text-xs text-text-muted ml-6">
          {helperText}
        </span>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
