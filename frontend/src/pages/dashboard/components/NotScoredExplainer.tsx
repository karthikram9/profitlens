import React from 'react';
import { Info } from 'lucide-react';

export const NotScoredExplainer: React.FC = () => {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-md flex items-start gap-md mb-lg">
      <div className="p-2 rounded-lg bg-primary/20 text-primary shrink-0 mt-0.5">
        <Info className="w-5 h-5" />
      </div>
      <div className="text-sm text-text-muted space-y-1">
        <h4 className="font-semibold text-text font-sans">
          Channel Scoping Notice: Amazon-Fulfilled Orders are Unscored
        </h4>
        <p>
          Return-risk prediction is applied <span className="font-semibold text-text">only to Merchant-fulfilled orders</span>.
          Amazon-fulfilled (FBA) orders do not have reliable individual return labels in marketplace reports and are strictly marked as{' '}
          <span className="font-semibold text-text font-mono">unscored</span> — they are never treated as Low risk.
        </p>
      </div>
    </div>
  );
};
