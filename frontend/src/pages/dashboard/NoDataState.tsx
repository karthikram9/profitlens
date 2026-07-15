import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

interface NoDataStateProps {
  status?: string;
}

export const NoDataState: React.FC<NoDataStateProps> = ({ status }) => {
  const navigate = useNavigate();

  const isProcessing = status && status !== 'ready' && status !== 'failed';

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-lg">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-md">
        {isProcessing ? (
          <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )}
      </div>

      <h2 className="text-xl font-bold text-text-primary mb-sm">
        {isProcessing ? 'Your data is being processed' : 'No data available'}
      </h2>
      
      <p className="text-text-secondary max-w-md mb-lg">
        {isProcessing
          ? 'We are currently analyzing and processing your recent upload. Check back shortly to see your dashboard.'
          : 'Upload your first marketplace sales report to generate insights and view your dashboard.'}
      </p>

      {!isProcessing && (
        <Button variant="primary" onClick={() => navigate('/upload')}>
          Upload Sales Data
        </Button>
      )}
    </div>
  );
};
