import React from 'react';
import type { LandingContent } from '../landingContent';

interface TrustBarProps {
  label: string;
  marketplaces: LandingContent['marketplaces'];
}

export const TrustBar: React.FC<TrustBarProps> = ({ label, marketplaces }) => {
  return (
    <section className="py-lg border-y border-border bg-bg">
      <div className="max-w-7xl mx-auto px-md md:px-lg">
        <div className="flex flex-col md:flex-row items-center gap-md md:gap-lg">
          <span className="text-sm font-semibold text-text-muted whitespace-nowrap">
            {label}
          </span>
          <div className="h-px md:h-6 w-full md:w-px bg-border" />
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-lg">
            {marketplaces.map((name) => (
              <span
                key={name}
                className="text-sm font-bold text-text-secondary tracking-wide uppercase"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
