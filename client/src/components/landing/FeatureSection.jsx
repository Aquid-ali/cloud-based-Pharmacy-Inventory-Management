import React from 'react';
import { Reveal } from './motion';
import { FEATURES } from '../../data/landingContent';

const [spotlight, ...rest] = FEATURES;

const FeatureSection = () => (
  <section className="w-full px-4 sm:px-6 lg:px-10 py-20 sm:py-24 bg-white">
    <div className="max-w-6xl mx-auto">
      <div className="max-w-xl mb-12">
        <Reveal>
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-lavender/10 text-lavender text-xs font-semibold">
            Why MedStock
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-5">
            Built for how you actually find medicine
          </h2>
        </Reveal>
      </div>

      <div className="space-y-5">
        {/* Editorial spotlight - the single most important feature gets its own
            full-width dark block instead of matching the grid below. */}
        <Reveal>
          <div className="rounded-3xl bg-gradient-to-br from-midnight to-deepBlue p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 text-cyanAccent flex items-center justify-center shrink-0">
              <spotlight.icon size={28} />
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white">{spotlight.title}</h3>
              <p className="text-landingGray text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
                {spotlight.description}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map(({ title, description, icon: Icon }, i) => (
            <Reveal key={title} delay={i * 0.08} className={i === 0 ? 'lg:col-span-2' : ''}>
              <div className="h-full rounded-3xl border border-slate-100 p-6 hover:border-electricBlue/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-electricBlue/10 text-electricBlue flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <h3 className="font-display text-base font-bold text-slate-900 mt-4">{title}</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default FeatureSection;
