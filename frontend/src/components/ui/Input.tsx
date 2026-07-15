import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  helperText,
  error,
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || React.useId();
  
  return (
    <div className="flex flex-col gap-xs w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-text-primary"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={cn(
          'w-full px-md py-sm bg-surface border rounded-md text-text-primary placeholder:text-text-muted transition-all duration-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          error ? 'border-danger focus:ring-danger' : 'border-border focus:ring-primary',
          className
        )}
        {...props}
      />
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

Input.displayName = 'Input';
