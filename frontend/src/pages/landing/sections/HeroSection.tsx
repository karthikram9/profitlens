import React from 'react';
import { Button } from '../../../components/ui/Button';
import { ArrowRight, Play, BarChart2, TrendingDown, TrendingUp } from 'lucide-react';
import type { LandingContent } from '../landingContent';

interface HeroSectionProps {
  content: LandingContent['hero'];
  onPrimary: () => void;
  onSecondary: () => void;
}

/** Abstract chart illustration — token-only SVG, no raster images */
const HeroIllustration: React.FC = () => (
  <div className="relative w-full max-w-md mx-auto">
    {/* Main dashboard card */}
    <div className="bg-surface rounded-lg border border-border shadow-lg p-lg">
      {/* Mini KPI row */}
      <div className="grid grid-cols-3 gap-sm mb-lg">
        {[
          { label: 'Net Profit', value: '₹2.4L', up: true },
          { label: 'Return Risk', value: '14.2%', up: false },
          { label: 'Orders', value: '1,840', up: true },
        ].map(({ label, value, up }) => (
          <div key={label} className="bg-bg rounded-md p-sm">
            <p className="text-xs text-text-muted mb-xs">{label}</p>
            <p className="text-base font-bold text-text-primary">{value}</p>
            <div className={`flex items-center gap-xs mt-xs text-xs font-semibold ${up ? 'text-success' : 'text-danger'}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{up ? '+8.3%' : '-3.1%'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Abstract bar chart */}
      <div className="flex items-end gap-xs h-24 mb-sm">
        {[40, 65, 45, 80, 60, 90, 55, 75, 85, 50, 70, 95].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-base"
            style={{
              height: `${h}%`,
              backgroundColor: i === 11
                ? 'var(--color-primary)'
                : i % 3 === 0
                ? 'var(--color-primary-hover)'
                : 'var(--color-border)',
            }}
          />
        ))}
      </div>
      <p className="text-xs text-text-muted">Monthly Profit Trend</p>
    </div>

    {/* Floating risk badge */}
    <div className="absolute -top-4 -right-4 bg-warning-bg border border-warning/20 text-warning text-xs font-bold px-sm py-xs rounded-full shadow-md flex items-center gap-xs">
      <BarChart2 className="h-3 w-3" />
      High Return Risk Detected
    </div>

    {/* Floating profit badge */}
    <div className="absolute -bottom-4 -left-4 bg-success-bg border border-success/20 text-success text-xs font-bold px-sm py-xs rounded-full shadow-md flex items-center gap-xs">
      <TrendingUp className="h-3 w-3" />
      ₹18,400 recovered this week
    </div>
  </div>
);

export const HeroSection: React.FC<HeroSectionProps> = ({
  content,
  onPrimary,
  onSecondary,
}) => {
  return (
    <section className="pt-32 pb-2xl px-md md:px-lg bg-gradient-to-br from-bg via-surface to-bg min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl items-center">
          {/* Copy — left on desktop */}
          <div className="space-y-lg">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-sm bg-primary/10 border border-primary/20 text-primary text-sm font-semibold px-md py-xs rounded-full">
              <TrendingUp className="h-4 w-4" />
              AI-Powered Profitability Analytics
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight tracking-tight">
              {content.headline}
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed max-w-lg">
              {content.subheadline}
            </p>

            <div className="flex flex-wrap gap-sm pt-sm">
              <Button
                variant="primary"
                size="lg"
                onClick={onPrimary}
                className="gap-sm"
              >
                {content.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={onSecondary}
                className="gap-sm"
              >
                <Play className="h-4 w-4 fill-current" />
                {content.secondaryCta}
              </Button>
            </div>

            {/* Social proof micro-stat */}
            <p className="text-sm text-text-muted pt-xs">
              Trusted by <span className="text-text-secondary font-semibold">200+ sellers</span> tracking over{' '}
              <span className="text-text-secondary font-semibold">₹12 Cr</span> in monthly GMV
            </p>
          </div>

          {/* Illustration — right on desktop */}
          <div className="flex justify-center lg:justify-end">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
