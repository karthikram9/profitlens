import React, { useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { apiRequest } from '../../lib/api-client';

interface Props {
  uploadId: string;
  onComplete: () => void;
  onError: (msg: string) => void;
}

export const RecomputeProgressModal: React.FC<Props> = ({ uploadId, onComplete, onError }) => {
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let isSubscribed = true;

    const pollStatus = async () => {
      try {
        const res = await apiRequest<{ status: string; errorMessage?: string }>(`/uploads/${uploadId}/status`);
        if (!isSubscribed) return;
        
        if (res.status === 'ready') {
          onComplete();
        } else if (res.status === 'failed') {
          onError(res.errorMessage || 'Recompute failed during processing.');
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        onError(err.message || 'Failed to poll status.');
      }
    };

    // Initial poll
    pollStatus();
    interval = setInterval(pollStatus, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [uploadId, onComplete, onError]);

  return (
    <Modal isOpen={true} onClose={() => {}} title="Recomputing Dataset...">
      <div className="py-xl flex flex-col items-center justify-center space-y-md">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="text-text-secondary text-center">
          Applying new business assumptions to your dataset.<br/>
          This may take a moment depending on the size of your data.
        </p>
      </div>
    </Modal>
  );
};
