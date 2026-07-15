import React from 'react';
import type { HowItWorksStep } from '../landingContent';

interface HowItWorksSectionProps {
  steps: HowItWorksStep[];
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ steps }) => {
  return (
    <section id="how-it-works" className="py-2xl px-md md:px-lg bg-bg">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-2xl max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            How it works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-sm">
            From raw data to clear decisions in minutes
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border z-0" />

          {steps.map(({ step, title, description }) => (
            <div key={step} className="relative z-10 flex flex-col items-center text-center">
              {/* Step number bubble */}
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center mb-lg shadow-md">
                <span className="text-2xl font-bold text-surface">{step}</span>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-sm">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
