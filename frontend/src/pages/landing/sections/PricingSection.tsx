import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Check } from 'lucide-react';
import type { PricingTier } from '../landingContent';

interface PricingSectionProps {
  tiers: PricingTier[];
  onSignUp: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ tiers, onSignUp }) => {
  return (
    <section id="pricing" className="py-2xl px-md md:px-lg bg-bg">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-2xl max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-sm">
            Simple, transparent pricing
          </h2>
          <p className="text-text-secondary mt-md leading-relaxed">
            Start for free. Upgrade when your business demands it.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md max-w-5xl mx-auto">
          {tiers.map((tier) => {
            const isRec = tier.isRecommended === true;
            return (
              <div
                key={tier.name}
                className={`relative bg-surface rounded-lg border flex flex-col ${
                  isRec
                    ? 'border-primary shadow-lg ring-2 ring-primary/20'
                    : 'border-border shadow-sm'
                }`}
              >
                {/* Recommended badge */}
                {isRec && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="success">Most Popular</Badge>
                  </div>
                )}

                <div className="p-lg flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                  <p className="text-sm text-text-muted mt-xs mb-lg">{tier.tagline}</p>

                  {/* Price display */}
                  <div className="mb-lg">
                    {tier.isPlaceholder ? (
                      <div className="flex flex-col gap-xs">
                        <span className="text-3xl font-bold text-text-primary">
                          {tier.price}
                        </span>
                        <Badge variant="warning">Pricing illustrative — not final</Badge>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-text-primary">
                        {tier.price}
                      </span>
                    )}
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-sm flex-1 mb-lg">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-sm text-sm text-text-secondary">
                        <Check className="h-4 w-4 text-success mt-[2px] flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant={isRec ? 'primary' : 'secondary'}
                    size="md"
                    className="w-full"
                    onClick={onSignUp}
                  >
                    {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-text-muted mt-lg">
          Pricing shown is illustrative. Final pricing will be confirmed before launch.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
