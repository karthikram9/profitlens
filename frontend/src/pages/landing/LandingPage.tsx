import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import landingContent from './landingContent';
import { LandingNav } from './LandingNav';
import { HeroSection } from './sections/HeroSection';
import { TrustBar } from './sections/TrustBar';
import { FeatureSection } from './sections/FeatureSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { BenefitsSection } from './sections/BenefitsSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { PricingSection } from './sections/PricingSection';
import { CTABanner } from './sections/CTABanner';
import { TrendingUp, Globe, Mail, ExternalLink } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

// ─── Scroll-fade animation hook ──────────────────────────────────────────────
function useFadeInOnScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity var(--transition-base), transform var(--transition-base)`;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

// ─── Animated section wrapper ─────────────────────────────────────────────────
const FadeSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useFadeInOnScroll();
  return <div ref={ref}>{children}</div>;
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const LandingFooter: React.FC = () => (
  <footer className="bg-text-primary py-2xl px-md md:px-lg">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-sm mb-md">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-surface" />
            </div>
            <span className="text-lg font-bold text-surface tracking-tight">
              Profit<span className="text-primary">Lens</span>
            </span>
          </div>
          <p className="text-sm text-surface/60 leading-relaxed max-w-xs">
            AI-powered profitability and return risk analytics for Indian e-commerce sellers.
          </p>
        </div>

        {/* Links */}
        {[
          {
            heading: 'Product',
            links: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
          },
          {
            heading: 'Company',
            links: ['About', 'Blog', 'Careers', 'Contact'],
          },
          {
            heading: 'Legal',
            links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
          },
        ].map(({ heading, links }) => (
          <div key={heading}>
            <p className="text-xs font-bold text-surface/40 uppercase tracking-widest mb-md">
              {heading}
            </p>
            <ul className="space-y-sm">
              {links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-surface/70 hover:text-surface transition-colors duration-fast"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-surface/10 pt-lg flex flex-col md:flex-row items-center justify-between gap-md">
        <p className="text-xs text-surface/40">
          © {new Date().getFullYear()} ProfitLens. All rights reserved.
        </p>
        <div className="flex items-center gap-md">
          {[
  { icon: Globe, label: 'Website' },
  { icon: Mail, label: 'Email' },
  { icon: ExternalLink, label: 'Documentation' },
].map(({ icon: Icon, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="text-surface/40 hover:text-surface transition-colors duration-fast"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ─── LandingPage ──────────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken, user, isLoading } = useAuth();

  // If a valid auth token exists, redirect to dashboard immediately
  useEffect(() => {
    if (!isLoading && (accessToken || user)) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, accessToken, user, isLoading]);

  const goToSignUp = () => navigate('/auth?tab=signup');
  const goToLogin = () => navigate('/auth?tab=login');
  const scrollToHowItWorks = () =>
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="bg-bg min-h-screen">
      <LandingNav onSignUp={goToSignUp} onLogin={goToLogin} />

      {/* Hero — not fade-animated, instant render above fold */}
      <HeroSection
        content={landingContent.hero}
        onPrimary={goToSignUp}
        onSecondary={scrollToHowItWorks}
      />

      <FadeSection>
        <TrustBar
          label={landingContent.trustBarLabel}
          marketplaces={landingContent.marketplaces}
        />
      </FadeSection>

      <FadeSection>
        <FeatureSection features={landingContent.features} />
      </FadeSection>

      <FadeSection>
        <HowItWorksSection steps={landingContent.howItWorks} />
      </FadeSection>

      <FadeSection>
        <BenefitsSection benefits={landingContent.benefits} />
      </FadeSection>

      {/* TestimonialsSection renders null if array is empty — intentional */}
      <FadeSection>
        <TestimonialsSection testimonials={landingContent.testimonials} />
      </FadeSection>

      <FadeSection>
        <PricingSection tiers={landingContent.pricingTiers} onSignUp={goToSignUp} />
      </FadeSection>

      <FadeSection>
        <CTABanner onSignUp={goToSignUp} />
      </FadeSection>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
