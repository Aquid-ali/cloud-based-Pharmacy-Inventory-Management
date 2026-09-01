import React from 'react';
import { FEATURES } from '../../data/landingContent';

const FeatureSection = () => (
  <section className="w-full px-4 sm:px-6 lg:px-10 py-14 bg-white">
    <div className="text-center max-w-xl mx-auto mb-10">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Why Choose Us?</h2>
      <p className="text-sm text-ink-soft mt-2">Built to make finding and understanding medicines simple.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
      {FEATURES.map(({ title, description, icon: Icon }) => (
        <div key={title} className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-tealPrimary/20 hover:bg-primary-50/40 transition-colors">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-primary-50 text-tealPrimary flex items-center justify-center">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">{title}</h3>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default FeatureSection;
