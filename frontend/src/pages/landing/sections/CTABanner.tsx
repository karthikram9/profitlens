import React from 'react';
import { Button } from '../../../components/ui/Button';
import { ArrowRight, TrendingUp } from 'lucide-react';

interface CTABannerProps {
  onSignUp: () => void;
}

export const CTABanner: React.FC<CTABannerProps> = ({ onSignUp }) => {
  return (
    <section className="py-2xl px-md md:px-lg bg-primary">
      <div className="max-w-3xl mx-auto text-center space-y-lg">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-surface/20 flex items-center justify-center">
            <TrendingUp className="h-7 w-7 text-surface" />
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-surface">
          Ready to see your real profit margins?
        </h2>
        <p className="text-surface/80 text-lg leading-relaxed">
          Upload your first sales report in under 2 minutes. No credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-sm pt-sm">
          <Button
            variant="secondary"
            size="lg"
            onClick={onSignUp}
            className="!bg-surface !text-primary hover:!bg-bg gap-sm font-bold"
          >
            Start Free Today
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
