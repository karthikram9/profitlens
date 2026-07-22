import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, FileSpreadsheet, Download, File } from 'lucide-react';
import { useDashboard } from '../../lib/dashboard-context';
import { getAuthToken } from '../../lib/api-client';
import { toast } from '../../components/ui/Toast';

export const ExportPage: React.FC = () => {
  const { currentUpload } = useDashboard();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!currentUpload) return;
    
    setDownloading(format);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${baseUrl}/export/${format}`;
      const token = getAuthToken();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download ${format.toUpperCase()} report.`);
      }

      // Extract filename from Content-Disposition if present
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `ProfitLens_Export.${format === 'excel' ? 'xlsx' : format}`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const parts = contentDisposition.split('filename=');
        if (parts.length > 1) {
          filename = parts[1].replace(/["']/g, '');
        }
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
      
      toast.success(`Successfully downloaded ${format.toUpperCase()} report.`);
    } catch (err: any) {
      toast.error('Download failed', err.message);
    } finally {
      setDownloading(null);
    }
  };

  if (!currentUpload) {
    return (
      <div className="max-w-4xl mx-auto py-xl px-md lg:px-xl flex items-center justify-center">
        <p className="text-text-secondary">Please upload a dataset first to access exports.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-xl px-md lg:px-xl animate-fade-in pb-20">
      <div className="mb-lg">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Export Reports</h1>
        <p className="text-text-secondary mt-1">Download your profitability analysis in various formats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* CSV Export */}
        <Card headerSlot={
            <div className="flex items-center gap-sm">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">CSV Data</h3>
            </div>
          }>
          <div className="flex flex-col h-full">
            <p className="text-sm text-text-secondary mb-lg flex-1">
              Raw tabular data containing all processed orders, financial metrics, and return risk scores. Ideal for importing into other tools.
            </p>
            <Button 
              className="w-full" 
              onClick={() => handleDownload('csv')}
              disabled={downloading !== null}
            >
              {downloading === 'csv' ? <span className="animate-pulse">Generating...</span> : <><Download size={16} className="mr-2" /> Download CSV</>}
            </Button>
          </div>
        </Card>

        {/* Excel Export */}
        <Card headerSlot={
            <div className="flex items-center gap-sm">
              <div className="p-2 bg-success/10 text-success rounded-lg">
                <FileSpreadsheet size={24} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Excel Workbook</h3>
            </div>
          }>
          <div className="flex flex-col h-full">
            <p className="text-sm text-text-secondary mb-lg flex-1">
              A formatted workbook featuring an executive summary, category performance rollups, and the complete detailed order log.
            </p>
            <Button 
              className="w-full bg-success hover:bg-success-dark text-white border-0" 
              onClick={() => handleDownload('excel')}
              disabled={downloading !== null}
            >
              {downloading === 'excel' ? <span className="animate-pulse">Generating...</span> : <><Download size={16} className="mr-2" /> Download Excel</>}
            </Button>
          </div>
        </Card>

        {/* PDF Export */}
        <Card headerSlot={
            <div className="flex items-center gap-sm">
              <div className="p-2 bg-danger/10 text-danger rounded-lg">
                <File size={24} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">PDF Report</h3>
            </div>
          }>
          <div className="flex flex-col h-full">
            <p className="text-sm text-text-secondary mb-lg flex-1">
              A visually polished, print-ready executive report with key KPIs, insights, and top category breakdowns.
            </p>
            <Button 
              className="w-full bg-danger hover:bg-danger-dark text-white border-0" 
              onClick={() => handleDownload('pdf')}
              disabled={downloading !== null}
            >
              {downloading === 'pdf' ? <span className="animate-pulse">Generating...</span> : <><Download size={16} className="mr-2" /> Download PDF</>}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
