import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { TrendingUp } from 'lucide-react';

interface LandingNavProps {
  onSignUp: () => void;
  onLogin: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ onSignUp, onLogin }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-base ${
        isScrolled
          ? 'bg-surface shadow-sm border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-md md:px-lg flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-sm">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-surface" />
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            Profit<span className="text-primary">Lens</span>
          </span>
        </div>

        {/* Anchor links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-lg">
          {[
            { label: 'Features', id: 'features' },
            { label: 'How It Works', id: 'how-it-works' },
            { label: 'Pricing', id: 'pricing' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-sm font-medium text-text-secondary hover:text-primary transition-colors duration-fast cursor-pointer bg-transparent border-none"
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-sm">
          <Button variant="ghost" size="sm" onClick={onLogin}>
            Log in
          </Button>
          <Button variant="primary" size="sm" onClick={onSignUp}>
            Start Free
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
