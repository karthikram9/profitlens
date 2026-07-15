import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { Benefit } from '../landingContent';

interface BenefitsSectionProps {
  benefits: Benefit[];
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ benefits }) => {
  return (
    <section className="py-2xl px-md md:px-lg bg-surface">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-2xl max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            Why sellers switch
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-sm">
            Stop flying blind. Start selling smarter.
          </h2>
        </div>

        {/* Two-column benefit pairs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl max-w-4xl mx-auto">
          {/* Pain points column header */}
          <div>
            <div className="flex items-center gap-sm mb-lg">
              <div className="h-8 w-8 rounded-full bg-danger-bg flex items-center justify-center">
                <X className="h-4 w-4 text-danger" />
              </div>
              <span className="text-sm font-bold text-danger uppercase tracking-wide">Before ProfitLens</span>
            </div>
            <div className="space-y-md">
              {benefits.map(({ painPoint }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-sm p-md bg-danger-bg/30 border border-danger/10 rounded-md"
                >
                  <X className="h-4 w-4 text-danger mt-[2px] flex-shrink-0" />
                  <p className="text-sm text-text-secondary leading-relaxed">{painPoint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Outcomes column header */}
          <div>
            <div className="flex items-center gap-sm mb-lg">
              <div className="h-8 w-8 rounded-full bg-success-bg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <span className="text-sm font-bold text-success uppercase tracking-wide">With ProfitLens</span>
            </div>
            <div className="space-y-md">
              {benefits.map(({ outcome }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-sm p-md bg-success-bg/40 border border-success/10 rounded-md"
                >
                  <CheckCircle className="h-4 w-4 text-success mt-[2px] flex-shrink-0" />
                  <p className="text-sm text-text-secondary leading-relaxed">{outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
