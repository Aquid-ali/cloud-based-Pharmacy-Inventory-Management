import React from 'react';
import { FiStar } from 'react-icons/fi';
import { TESTIMONIALS } from '../../data/landingContent';

const TestimonialsSection = () => (
  <section className="w-full px-4 sm:px-6 lg:px-10 py-14">
    <div className="text-center max-w-xl mx-auto mb-2">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Customer Reviews</h2>
    </div>
    <p className="text-center text-[11px] text-slate-400 mb-10">Demo testimonials, shown to illustrate the experience</p>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
      {TESTIMONIALS.map(({ name, quote }) => (
        <div key={name} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
          <div className="flex gap-0.5 text-amber-400 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <FiStar key={i} size={14} fill="currentColor" />
            ))}
          </div>
          <p className="text-sm text-ink-soft leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
          <p className="text-xs font-semibold text-ink mt-4">— {name}</p>
        </div>
      ))}
    </div>
  </section>
);

export default TestimonialsSection;
