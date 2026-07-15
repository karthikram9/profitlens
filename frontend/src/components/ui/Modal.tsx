import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerSlot,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape press and manage body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Simple Focus Trap: focus the modal container on open
      if (modalRef.current) {
        modalRef.current.focus();
      }
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-text-primary/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-lg bg-surface border border-border rounded-lg shadow-lg flex flex-col max-h-[85vh] overflow-hidden z-10 outline-none",
          "transition-all duration-base transform ease-in-out scale-100",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-border bg-surface">
          <h3 className="text-lg font-bold text-text-primary">
            {title || 'Dialog'}
          </h3>
          <button
            onClick={onClose}
            className="p-xs rounded-md text-text-muted hover:bg-bg hover:text-text-primary transition-colors duration-fast"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-lg overflow-y-auto flex-1 text-sm text-text-secondary leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footerSlot && (
          <div className="px-lg py-md border-t border-border bg-bg/50 flex justify-end gap-sm">
            {footerSlot}
          </div>
        )}
      </div>
    </div>
  );
};
export default Modal;
