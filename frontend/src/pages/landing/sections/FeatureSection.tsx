import React from 'react';
import { Card } from '../../../components/ui/Card';
import type { Feature } from '../landingContent';

interface FeatureSectionProps {
  features: Feature[];
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({ features }) => {
  return (
    <section id="features" className="py-2xl px-md md:px-lg bg-surface">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-2xl max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            What ProfitLens does
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-sm">
            Everything you need to run a profitable operation
          </h2>
          <p className="text-text-secondary mt-md leading-relaxed">
            Four analytics capabilities, one dashboard. Built specifically for Indian
            e-commerce sellers who want clarity, not complexity.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              interactive
              className="flex flex-col gap-md hover:border-primary/30 group"
            >
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-base">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary mb-xs">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
