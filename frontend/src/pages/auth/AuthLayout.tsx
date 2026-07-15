import React from 'react';
import { TrendingUp } from 'lucide-react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-2xl sm:px-lg lg:px-2xl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-sm mb-lg">
          <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center shadow-sm">
            <TrendingUp className="h-6 w-6 text-surface" />
          </div>
          <span className="text-2xl font-bold text-text-primary tracking-tight">
            Profit<span className="text-primary">Lens</span>
          </span>
        </div>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-lg px-md sm:px-xl shadow-lg border border-border sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};
