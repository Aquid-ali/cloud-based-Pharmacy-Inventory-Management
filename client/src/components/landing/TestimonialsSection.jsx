import React from 'react';
import { FiStar } from 'react-icons/fi';
import { TESTIMONIALS } from '../../data/landingContent';
import { Reveal, StaggerGroup, StaggerItem } from './motion';

const TestimonialsSection = () => (
  <section className="w-full px-4 sm:px-6 lg:px-10 py-20 sm:py-24 bg-landingOffWhite">
    <div className="text-center max-w-xl mx-auto mb-2">
      <Reveal>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">What people are saying</h2>
      </Reveal>
    </div>
    <Reveal delay={0.1}>
      <p className="text-center text-[11px] text-slate-400 mb-10">Demo testimonials, shown to illustrate the experience</p>
    </Reveal>

    <StaggerGroup className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
      {TESTIMONIALS.map(({ name, quote }) => (
        <StaggerItem key={name}>
          <div className="h-full bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
            <div className="flex gap-0.5 text-amber-400 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
            <p className="text-xs font-semibold text-slate-900 mt-4">— {name}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerGroup>
  </section>
);

export default TestimonialsSection;
