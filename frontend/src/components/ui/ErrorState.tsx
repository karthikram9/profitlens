import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-2xl text-center bg-danger-bg/25 border border-danger/10 rounded-lg shadow-sm">
      <div className="p-md bg-danger-bg rounded-full text-danger mb-md">
        <AlertCircle className="h-8 w-8 text-danger" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-xs">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-lg">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="destructive" size="md">
          Retry
        </Button>
      )}
    </div>
  );
};
export default ErrorState;
