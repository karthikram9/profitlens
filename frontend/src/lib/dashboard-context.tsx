import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiRequest } from './api-client';
import { useAuth } from './auth-context';

export interface CurrentUpload {
  uploadId: string;
  status: string;
  originalFilename: string;
  marketplaceDetected: string | null;
  rowCountProcessed: number | null;
  uploadedAt: string;
}

interface DashboardContextType {
  currentUpload: CurrentUpload | null;
  isLoading: boolean;
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentUpload, setCurrentUpload] = useState<CurrentUpload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUpload = useCallback(async () => {
    if (!user) {
      setCurrentUpload(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest<CurrentUpload | null>('/uploads/current');
      setCurrentUpload(data);
    } catch (error) {
      console.error('Failed to fetch current upload:', error);
      setCurrentUpload(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCurrentUpload();
  }, [fetchCurrentUpload]);

  return (
    <DashboardContext.Provider value={{ currentUpload, isLoading, refreshDashboard: fetchCurrentUpload }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
