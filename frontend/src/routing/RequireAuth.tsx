import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text-secondary">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?tab=login&redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};
