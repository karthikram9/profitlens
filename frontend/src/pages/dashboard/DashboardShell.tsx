import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useDashboard } from '../../lib/dashboard-context';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';
import { NoDataState } from './NoDataState';
import { Skeleton } from '../../components/ui/Skeleton';

export const DashboardShell: React.FC = () => {
  const { currentUpload, isLoading } = useDashboard();
  const location = useLocation();

  // Handle redirect from /dashboard to /dashboard/overview
  if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
    return <Navigate to="/dashboard/overview" replace />;
  }

  // Loading state (initial context fetch)
  if (isLoading) {
    return (
      <div className="flex h-screen bg-bg">
        <div className="w-64 border-r border-border bg-surface hidden md:block">
          <div className="p-4"><Skeleton className="h-8 w-32" /></div>
          <div className="p-4 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-border bg-surface flex items-center px-4">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-8">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const hasReadyUpload = currentUpload?.status === 'ready';

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar />
        
        <main className="flex-1 overflow-y-auto bg-bg p-md md:p-xl">
          {!hasReadyUpload ? (
            <NoDataState status={currentUpload?.status} />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};
