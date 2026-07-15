import React from 'react';
import type { Testimonial } from '../landingContent';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

/**
 * Returns null if testimonials array is empty.
 * Never renders fabricated quotes — honest empty state only.
 * TODO: Replace with real customer testimonials once collected.
 */
export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials,
}) => {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-2xl px-md md:px-lg bg-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-2xl max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            Seller stories
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-sm">
            What our sellers say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {testimonials.map(({ quote, author, role, company }) => (
            <div
              key={author}
              className="bg-surface border border-border rounded-lg p-lg shadow-sm flex flex-col gap-md"
            >
              <p className="text-text-secondary text-sm leading-relaxed italic">
                "{quote}"
              </p>
              <div className="mt-auto">
                <p className="text-sm font-bold text-text-primary">{author}</p>
                <p className="text-xs text-text-muted">
                  {role}, {company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
