import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api-client';
import { toast } from '../../components/ui/Toast';
import { FileDropzone } from './FileDropzone';
import { UploadProgressBar } from './UploadProgressBar';
import type { UploadStage } from './UploadProgressBar';

import { ColumnMappingTable, buildMappingRows } from './ColumnMappingTable';
import { ValidationWarningsList } from './ValidationWarningsList';
import type { ExclusionReason } from './ValidationWarningsList';
import { FileSummaryCard } from './FileSummaryCard';
import type { FileSummaryData } from './FileSummaryCard';
import { Button } from '../../components/ui/Button';

// From schema_registry.py
const REQUIRED_FIELDS = [
  'order_id', 'date', 'status', 'fulfilment', 'category', 'qty', 'amount', 'ship_state', 'b2b'
];
const OPTIONAL_FIELDS = [
  'ship_city', 'sku', 'ship_service_level', 'sales_channel', 'size'
];

interface UploadInitResponse {
  uploadId: string;
  marketplaceDetected: string | null;
  confidence: number;
  proposedMapping: Record<string, string>;
  unmatchedRequiredFields: string[];
  previewRows: any[];
  status: string;
}

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  const [stage, setStage] = useState<UploadStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [hasExistingData, setHasExistingData] = useState(false);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<number>(0);
  
  const [summaryData, setSummaryData] = useState<FileSummaryData | null>(null);
  const [exclusionReasons, setExclusionReasons] = useState<ExclusionReason[]>([]);

  // 1. Check for existing upload on mount
  useEffect(() => {
    const checkCurrent = async () => {
      try {
        const current = await apiRequest<any>('/uploads/current');
        if (current && current.status === 'ready') {
          setHasExistingData(true);
        }
      } catch (err) {
        // Ignore, maybe no active upload
      }
    };
    checkCurrent();
  }, []);

  // 2. Handle File Drop
  const handleFileSelected = async (file: File) => {
    if (hasExistingData && !showOverwriteWarning) {
      setShowOverwriteWarning(true);
      return;
    }
    
    setShowOverwriteWarning(false);
    setStage('uploading');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiRequest<UploadInitResponse>('/uploads', {
        method: 'POST',
        body: formData,
        // We let the browser set Content-Type with the boundary for FormData
      });

      setUploadId(res.uploadId);
      setConfidence(res.confidence);
      
      // Extract available columns from the first preview row (if any)
      const cols = res.previewRows.length > 0 ? Object.keys(res.previewRows[0]) : [];
      setAvailableColumns(cols);

      // Initialize mapping state
      const initialMapping: Record<string, string> = {};
      REQUIRED_FIELDS.forEach(f => {
         if (res.proposedMapping[f]) initialMapping[f] = res.proposedMapping[f];
      });
      OPTIONAL_FIELDS.forEach(f => {
         if (res.proposedMapping[f]) initialMapping[f] = res.proposedMapping[f];
      });
      setMapping(initialMapping);

      if (res.status === 'mapping_required') {
        setStage('mapping');
        if (res.confidence < 0.70) {
           toast.info('Marketplace not recognized. Please map columns manually.');
        } else {
           toast.info('Please review the column mapping before continuing.');
        }
      } else {
        setStage('mapping'); // Always show mapping for confirmation
      }

    } catch (err: any) {
      setStage('failed');
      setErrorMessage(err.error?.message || 'Failed to upload file.');
      toast.error('Upload failed');
    }
  };

  // 3. Confirm Mapping & Start Processing
  const handleConfirmMapping = async () => {
    if (!uploadId) return;

    // Validate required fields client-side
    const missing = REQUIRED_FIELDS.filter(f => !mapping[f]);
    if (missing.length > 0) {
      toast.error('Please map all required fields.');
      return;
    }

    setStage('processing');
    setErrorMessage(null);

    try {
      await apiRequest(`/uploads/${uploadId}/confirm-mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping }),
      });
      
      // Polling starts automatically because stage changed to 'processing'
    } catch (err: any) {
      setStage('failed');
      setErrorMessage(err.error?.message || 'Failed to start processing.');
      toast.error('Processing failed');
    }
  };

  // 4. Poll for Processing Status
  useEffect(() => {
    if (stage !== 'processing' || !uploadId) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const pollStatus = async () => {
      try {
        const statusRes = await apiRequest<any>(`/uploads/${uploadId}/status`);
        
        if (statusRes.status === 'ready') {
          // Fetch summary
          const summaryRes = await apiRequest<any>(`/uploads/${uploadId}/summary`);
          setSummaryData(summaryRes);
          setExclusionReasons(summaryRes.exclusionReasons || []);
          setStage('ready');
          toast.success('Processing complete!');
        } else if (statusRes.status === 'failed') {
          setStage('failed');
          setErrorMessage(statusRes.errorMessage || 'Processing failed.');
          toast.error('Processing failed');
        } else {
          // Continue polling
          timeoutId = setTimeout(pollStatus, 2000);
        }
      } catch (err) {
        // If polling fails, assume temporary network issue and retry
        timeoutId = setTimeout(pollStatus, 3000);
      }
    };

    pollStatus();

    return () => clearTimeout(timeoutId);
  }, [stage, uploadId]);

  // Derived props for components
  const mappingRows = buildMappingRows(mapping, REQUIRED_FIELDS, OPTIONAL_FIELDS, confidence);
  const isConfirmDisabled = REQUIRED_FIELDS.some(f => !mapping[f]);

  return (
    <div className="max-w-4xl mx-auto py-2xl px-md sm:px-lg space-y-xl">
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-sm">Upload Sales Data</h1>
        <p className="text-text-secondary text-base">
          Upload your raw marketplace sales report. We'll clean it and generate insights.
        </p>
      </div>

      <UploadProgressBar stage={stage} errorMessage={errorMessage} />

      {/* File Dropzone & Overwrite Warning */}
      {stage === 'idle' && (
        <div className="space-y-md mt-lg">
          {showOverwriteWarning && (
             <div className="p-md rounded-md bg-warning/10 border border-warning/20 text-warning text-sm font-medium flex items-center justify-between">
                <span>
                  <strong>Warning:</strong> You already have processed data. Uploading a new file will replace your current dataset.
                </span>
                <Button variant="secondary" onClick={() => setShowOverwriteWarning(false)}>Cancel</Button>
             </div>
          )}
          <FileDropzone 
            onFileSelected={handleFileSelected} 
            isDisabled={showOverwriteWarning} 
          />
        </div>
      )}

      {/* Mapping State */}
      {stage === 'mapping' && (
        <div className="space-y-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
             <h2 className="text-lg font-semibold text-text-primary">Confirm Column Mapping</h2>
             <Button 
                variant="primary" 
                onClick={handleConfirmMapping} 
                disabled={isConfirmDisabled}
             >
                Confirm & Process
             </Button>
          </div>
          <ColumnMappingTable 
            rows={mappingRows}
            availableColumns={availableColumns}
            onMappingChange={(field, col) => setMapping(prev => ({ ...prev, [field]: col }))}
          />
        </div>
      )}

      {/* Ready State */}
      {stage === 'ready' && summaryData && (
        <div className="space-y-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ValidationWarningsList exclusions={exclusionReasons} />
          <FileSummaryCard 
             summary={summaryData} 
             isReady={true} 
             onContinue={() => navigate('/dashboard')} 
          />
        </div>
      )}
    </div>
  );
};
