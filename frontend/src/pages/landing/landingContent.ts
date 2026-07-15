/**
 * landingContent.ts
 * Single source of truth for all copy on the ProfitLens landing page.
 * Components render from this config — no hardcoded strings in component files.
 */

import {
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Globe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export interface Benefit {
  painPoint: string;
  outcome: string;
}

export interface PricingTier {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  isPlaceholder: boolean;
  isRecommended?: boolean;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface LandingContent {
  hero: {
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
  };
  features: Feature[];
  howItWorks: HowItWorksStep[];
  benefits: Benefit[];
  pricingTiers: PricingTier[];
  testimonials: Testimonial[];
  trustBarLabel: string;
  marketplaces: string[];
}

const landingContent: LandingContent = {
  hero: {
    headline: 'Know Exactly Where Your Business Is Losing Money',
    subheadline:
      'ProfitLens turns your Amazon sales data into clear profit margins and return risk scores — so you stop guessing and start deciding.',
    primaryCta: 'Start Free',
    secondaryCta: 'See how it works',
  },

  trustBarLabel: 'Works with data from',
  marketplaces: ['Amazon', 'Flipkart', 'Meesho', 'Myntra', 'Nykaa'],

  features: [
    {
      icon: BarChart3,
      title: 'Profitability Analytics',
      description:
        'See true net profit per order, category, and SKU — after deducting COGS, platform fees, shipping, GST, and return losses. No more spreadsheet guesswork.',
    },
    {
      icon: AlertTriangle,
      title: 'Return Risk Prediction',
      description:
        'Our ML model scores every order\'s return probability before dispatch. Flag high-risk shipments, understand which categories bleed the most, and act before the return lands.',
    },
    {
      icon: Lightbulb,
      title: 'Actionable Recommendations',
      description:
        'ProfitLens doesn\'t just show data — it tells you what to do. Get specific suggestions: pause a SKU, rethink pricing in a state, or renegotiate with a logistics partner.',
    },
    {
      icon: Globe,
      title: 'Any Marketplace, One Dashboard',
      description:
        'Unified analytics across your selling channels. Upload reports from Amazon, Flipkart, or Meesho and compare performance side-by-side in a single view.',
    },
  ],

  howItWorks: [
    {
      step: 1,
      title: 'Upload Your Sales Report',
      description:
        'Export your sales report from Amazon Seller Central (or any supported marketplace) and upload the CSV. ProfitLens maps your columns automatically.',
    },
    {
      step: 2,
      title: 'We Analyze Profit & Return Risk',
      description:
        'Our engine calculates true net profit for every order and runs our return-risk model. Results appear in seconds — no waiting, no configuration.',
    },
    {
      step: 3,
      title: 'Get Clear Business Recommendations',
      description:
        'Review your dashboard, spot the leaks, and act on specific recommendations. Revisit anytime as new data comes in.',
    },
  ],

  benefits: [
    {
      painPoint: 'Spreadsheets don\'t tell you if you\'re actually profitable after returns and fees.',
      outcome: 'See true profit per category in minutes, including every hidden cost.',
    },
    {
      painPoint: 'You find out about high-return products weeks after shipping them.',
      outcome: 'Flag return-risk orders before they leave the warehouse — not after.',
    },
    {
      painPoint: 'Intuition and guesswork drive pricing and stocking decisions.',
      outcome: 'Data-backed recommendations tell you exactly what to change and why.',
    },
    {
      painPoint: 'Selling on multiple platforms means juggling multiple reports.',
      outcome: 'One upload flow, one dashboard, all your marketplaces in one view.',
    },
  ],

  pricingTiers: [
    {
      name: 'Starter',
      price: '₹0',
      tagline: 'For sellers just getting started with analytics.',
      isPlaceholder: true,
      features: [
        'Up to 500 orders / month',
        'Profit analytics dashboard',
        'Basic return risk scoring',
        'CSV upload (1 marketplace)',
        'Email support',
      ],
    },
    {
      name: 'Growth',
      price: '₹999/mo',
      tagline: 'For sellers scaling across categories and states.',
      isPlaceholder: true,
      isRecommended: true,
      features: [
        'Up to 10,000 orders / month',
        'Full profit breakdown by SKU & state',
        'Advanced return risk + recommendations',
        'Multi-marketplace uploads',
        'Export reports (PDF / Excel)',
        'Priority support',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      tagline: 'For large sellers and aggregators with high volumes.',
      isPlaceholder: true,
      features: [
        'Unlimited orders',
        'Custom model tuning for your catalog',
        'API access for integrations',
        'Dedicated account manager',
        'SLA-backed uptime guarantee',
        'Onboarding & training sessions',
      ],
    },
  ],

  // Keep this array empty until real testimonials are collected.
  // TestimonialsSection renders nothing if this is empty.
  testimonials: [],
};

export default landingContent;
