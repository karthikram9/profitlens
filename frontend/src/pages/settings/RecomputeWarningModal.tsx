import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const RecomputeWarningModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Settings & Recompute">
      <div className="space-y-md">
        <div className="p-md bg-warning/10 border border-warning/20 rounded-md">
          <p className="text-warning-dark font-medium mb-sm">Warning: This will recalculate your active dataset.</p>
          <p className="text-sm text-text-secondary">
            Changing these assumptions will immediately re-run the profit calculations and return risk scores for all orders in your current active dataset. This process cannot be undone.
          </p>
        </div>
        <p className="text-sm text-text-primary">
          Are you sure you want to save these settings and trigger a recompute?
        </p>
        <div className="flex justify-end gap-sm pt-sm">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm}>Save & Recompute</Button>
        </div>
      </div>
    </Modal>
  );
};
