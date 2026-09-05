import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiSearch, FiMapPin, FiMessageCircle } from 'react-icons/fi';
import { Reveal } from './motion';

const STEPS = [
  {
    icon: FiSearch,
    title: 'Search for your medicine',
    description: 'Find what you need from an organized, searchable catalog — by name, composition, or condition.',
  },
  {
    icon: FiMapPin,
    title: 'Discover nearby pharmacies',
    description: 'See real pharmacies that actually stock it, mapped and sorted by distance from you.',
  },
  {
    icon: FiMessageCircle,
    title: 'Message, order, or get directions',
    description: 'Reach out to the pharmacy directly, place an order, or head straight there with in-app directions.',
  },
];

const HowItWorksSection = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 py-20 sm:py-24 bg-landingOffWhite">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <Reveal>
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-electricBlue/10 text-electricBlue text-xs font-semibold">
              How It Works
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-5">
              Three steps to your medicine
            </h2>
          </Reveal>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
          <div className="hidden sm:block absolute top-8 left-[16.5%] right-[16.5%] h-px bg-slate-200 overflow-hidden">
            <motion.div
              initial={reduceMotion ? undefined : { scaleX: 0 }}
              whileInView={reduceMotion ? undefined : { scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{ transformOrigin: 'left' }}
              className="h-full w-full bg-gradient-to-r from-electricBlue to-lavender"
            />
          </div>

          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={i * 0.15} className="relative text-center sm:text-left">
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50 flex items-center justify-center mx-auto sm:mx-0">
                <Icon className="text-electricBlue" size={24} />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-electricBlue to-lavender text-white text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mt-5">{title}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto sm:mx-0">{description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
