import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  className,
  label,
  helperText,
  error,
  options,
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || React.useId();

  return (
    <div className="flex flex-col gap-xs w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-semibold text-text-primary"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'w-full px-md py-sm bg-surface border rounded-md text-text-primary transition-all duration-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer',
          error ? 'border-danger focus:ring-danger' : 'border-border focus:ring-primary',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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

Select.displayName = 'Select';
