import React from 'react';

export type UploadStage =
  | 'idle'
  | 'uploading'
  | 'detecting'
  | 'mapping'
  | 'processing'
  | 'ready'
  | 'failed';

interface Stage {
  key: UploadStage;
  label: string;
  description: string;
}

const STAGES: Stage[] = [
  { key: 'uploading',  label: 'Uploading',         description: 'Sending file to server…' },
  { key: 'detecting',  label: 'Detecting Schema',   description: 'Identifying marketplace & columns…' },
  { key: 'mapping',    label: 'Awaiting Mapping',   description: 'Confirm or adjust column mapping below.' },
  { key: 'processing', label: 'Processing',         description: 'Running profit & risk calculations…' },
  { key: 'ready',      label: 'Ready',              description: 'Your data is ready to explore.' },
];

const STATUS_STAGES: UploadStage[] = ['uploading', 'detecting', 'mapping', 'processing', 'ready'];

interface UploadProgressBarProps {
  stage: UploadStage;
  errorMessage?: string | null;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ stage, errorMessage }) => {
  if (stage === 'idle') return null;

  const currentIdx = STATUS_STAGES.indexOf(stage === 'failed' ? 'processing' : stage);
  const currentStage = STAGES.find((s) => s.key === stage);
  const isFailed = stage === 'failed';

  return (
    <div className="w-full space-y-md">
      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STAGES.map((s, idx) => {
          const stepIdx = STATUS_STAGES.indexOf(s.key);
          const isDone    = !isFailed && stepIdx < currentIdx;
          const isActive  = !isFailed && stepIdx === currentIdx;
          const isFail    = isFailed && stepIdx === currentIdx;
          const isPending = stepIdx > currentIdx;

          return (
            <React.Fragment key={s.key}>
              {/* Step circle */}
              <div className="flex flex-col items-center gap-xs flex-shrink-0">
                <div
                  className={[
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                    'transition-all duration-base',
                    isDone    ? 'bg-success text-surface'              : '',
                    isActive  ? 'bg-primary text-surface ring-4 ring-primary/20' : '',
                    isFail    ? 'bg-danger text-surface'               : '',
                    isPending ? 'bg-border text-text-muted'            : '',
                  ].join(' ')}
                >
                  {isDone ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isFail ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                {/* Label below circle — hidden on small screens */}
                <span
                  className={[
                    'text-xs text-center hidden sm:block max-w-[80px] leading-tight',
                    isDone || isActive ? 'text-text-primary font-medium' : 'text-text-muted',
                  ].join(' ')}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector line (except after last step) */}
              {idx < STAGES.length - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 mx-1 transition-all duration-base',
                    isDone ? 'bg-success' : 'bg-border',
                  ].join(' ')}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current stage description */}
      <div
        className={[
          'rounded-md px-md py-sm text-sm text-center',
          isFailed
            ? 'bg-danger/10 text-danger border border-danger/20'
            : stage === 'ready'
            ? 'bg-success/10 text-success border border-success/20'
            : 'bg-primary/5 text-text-secondary border border-primary/10',
        ].join(' ')}
      >
        {isFailed ? (
          <span>
            <strong>Processing failed.</strong>{' '}
            {errorMessage || 'An unexpected error occurred. Please try again.'}
          </span>
        ) : (
          <span>
            {stage === 'mapping' && (
              <strong className="text-warning mr-xs">Action required — </strong>
            )}
            {currentStage?.description}
          </span>
        )}
      </div>
    </div>
  );
};
