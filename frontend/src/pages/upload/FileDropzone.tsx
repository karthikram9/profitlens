import React, { useCallback, useRef, useState } from 'react';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  isDisabled?: boolean;
}

import sharedConfig from '../../../../shared_config.json';

const MAX_SIZE_MB = sharedConfig.MAX_UPLOAD_SIZE_MB || 200;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileSelected, isDisabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File) => {
      setSizeError(null);
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setSizeError('Only .csv files are accepted.');
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setSizeError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${MAX_SIZE_MB} MB.`);
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (isDisabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndEmit(file);
    },
    [isDisabled, validateAndEmit],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndEmit(file);
    // reset so same file can be re-selected after an error
    e.target.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => { if (!isDisabled) inputRef.current?.click(); }}
      className={[
        'relative flex flex-col items-center justify-center gap-md',
        'border-2 border-dashed rounded-lg p-2xl cursor-pointer',
        'transition-all duration-base',
        isDragging && !isDisabled
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border hover:border-primary/50 hover:bg-primary/[0.02]',
        isDisabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
      role="button"
      aria-label="Upload CSV file"
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="sr-only"
        onChange={handleInputChange}
        disabled={isDisabled}
        aria-hidden="true"
      />

      {/* Upload icon */}
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-text-primary font-semibold text-base">
          {isDragging ? 'Drop your CSV here' : 'Drag & drop your sales report CSV'}
        </p>
        <p className="text-text-muted text-sm mt-xs">
          or <span className="text-primary font-medium underline underline-offset-2">click to browse</span>
        </p>
        <p className="text-text-muted text-xs mt-sm">
          .csv only · max {MAX_SIZE_MB} MB
        </p>
      </div>

      {sizeError && (
        <div className="w-full rounded-md bg-danger/10 border border-danger/30 px-md py-sm text-sm text-danger text-center">
          {sizeError}
        </div>
      )} 
    </div>
  );
};
