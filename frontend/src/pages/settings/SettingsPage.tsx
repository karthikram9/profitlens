import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api-client';
import { SettingsForm, type BusinessAssumptions } from './SettingsForm';
import { RecomputeWarningModal } from './RecomputeWarningModal';
import { RecomputeProgressModal } from './RecomputeProgressModal';
import { toast } from '../../components/ui/Toast';
import { useDashboard } from '../../lib/dashboard-context';

export const SettingsPage: React.FC = () => {
  const { currentUpload, refreshDashboard } = useDashboard();
  const [assumptions, setAssumptions] = useState<BusinessAssumptions | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [pendingAssumptions, setPendingAssumptions] = useState<BusinessAssumptions | null>(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isRecomputing, setIsRecomputing] = useState(false);

  useEffect(() => {
    const fetchAssumptions = async () => {
      try {
        const data = await apiRequest<BusinessAssumptions>('/settings/business-assumptions');
        setAssumptions(data);
      } catch (err: any) {
        toast.error('Failed to load settings', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAssumptions();
  }, []);

  const handleSaveRequest = (newAssumptions: BusinessAssumptions) => {
    setPendingAssumptions(newAssumptions);
    setIsWarningOpen(true);
  };

  const confirmSaveAndRecompute = async () => {
    setIsWarningOpen(false);
    if (!pendingAssumptions) return;
    
    try {
      // 1. Save settings
      await apiRequest('/settings/business-assumptions', {
        method: 'PUT',
        body: JSON.stringify(pendingAssumptions),
      });
      setAssumptions(pendingAssumptions);
      
      // 2. Trigger recompute if there is an active upload
      if (currentUpload) {
        setIsRecomputing(true);
        await apiRequest(`/uploads/${currentUpload.uploadId}/recompute`, {
          method: 'POST'
        });
      } else {
        toast.success('Settings saved successfully');
      }
    } catch (err: any) {
      toast.error('Failed to save settings', err.message);
      setIsRecomputing(false);
    }
  };

  const handleRecomputeComplete = () => {
    setIsRecomputing(false);
    toast.success('Data reprocessed successfully with new settings');
    refreshDashboard(); 
  };

  const handleRecomputeError = (err: string) => {
    setIsRecomputing(false);
    toast.error('Reprocessing failed: ' + err);
    refreshDashboard();
  };

  if (loading) {
    return <div className="p-xl flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-xl px-md lg:px-xl animate-fade-in pb-20">
      <div className="mb-lg">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Business Assumptions</h1>
        <p className="text-text-secondary mt-1">Configure your cost metrics. Changes will re-evaluate your current dataset.</p>
      </div>

      {assumptions && (
        <SettingsForm initialData={assumptions} onSave={handleSaveRequest} />
      )}

      {isWarningOpen && (
        <RecomputeWarningModal
          isOpen={isWarningOpen}
          onClose={() => setIsWarningOpen(false)}
          onConfirm={confirmSaveAndRecompute}
        />
      )}

      {isRecomputing && currentUpload && (
        <RecomputeProgressModal
          uploadId={currentUpload.uploadId}
          onComplete={handleRecomputeComplete}
          onError={handleRecomputeError}
        />
      )}
    </div>
  );
};
