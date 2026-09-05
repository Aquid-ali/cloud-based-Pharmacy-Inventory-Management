import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowRight, FiMapPin } from 'react-icons/fi';
import { TbPill, TbClock, TbShieldCheck } from 'react-icons/tb';
import { Reveal } from './motion';

// Illustrative mock of the app's own search-results UI (same convention the
// previous hero used) - generic, widely-known medicine names, not a claim
// about any specific pharmacy's real-time stock or distance.
const MOCK_ROWS = [
  { name: 'Paracetamol 500mg', tag: 'In Stock' },
  { name: 'Cetirizine 10mg', tag: 'In Stock' },
  { name: 'Vitamin D3', tag: 'Low Stock' },
];

const FLOATING_BADGES = [
  { icon: FiMapPin, label: '2.4 km away', className: '-left-4 sm:-left-8 top-8', delay: 0.1 },
  { icon: TbPill, label: 'Medicine Available', className: '-right-4 sm:-right-10 top-1/3', delay: 0.3 },
  { icon: TbClock, label: 'Open Now', className: '-left-6 sm:-left-10 bottom-16', delay: 0.5 },
  { icon: TbShieldCheck, label: 'Verified Pharmacy', className: '-right-2 sm:-right-6 bottom-0', delay: 0.7 },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-midnight pt-[72px]">
      {/* Ambient gradient orbs - purely decorative, respects reduced motion via the animate-float utility's own duration collapse in index.css */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-electricBlue/20 blur-[100px] animate-float" aria-hidden="true" />
      <div
        className="pointer-events-none absolute top-1/3 -right-32 w-[26rem] h-[26rem] rounded-full bg-lavender/20 blur-[100px] animate-float"
        style={{ animationDelay: '2.5s' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #94A3B8 1px, transparent 1px), linear-gradient(to bottom, #94A3B8 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full px-4 sm:px-6 lg:px-10 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="min-w-0 max-w-xl">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 text-cyanAccent text-xs font-semibold border border-white/10">
              Online Pharmacy &amp; Healthcare Platform
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] mt-6">
              Healthcare,{' '}
              <span className="bg-gradient-to-r from-cyanAccent via-electricBlue to-lavender bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                Closer
              </span>{' '}
              Than Ever.
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-landingGray text-sm sm:text-base mt-5 leading-relaxed max-w-md">
              Search real medicines, find pharmacies that actually stock them nearby, and message the pharmacy
              directly — all from one connected platform.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button
                onClick={() => navigate('/customer/medicines')}
                className="flex items-center gap-2 bg-gradient-to-r from-electricBlue to-lavender hover:opacity-90 text-white text-sm font-semibold px-6 py-3.5 rounded-full transition-opacity shadow-lg shadow-electricBlue/20"
              >
                Find Medicines <FiArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/shop/stores')}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold px-6 py-3.5 rounded-full border border-white/15 transition-colors"
              >
                Explore Pharmacies
              </button>
            </div>
          </Reveal>
        </div>

        {/* Floating "digital pharmacy interface" visual */}
        <div className="hidden lg:block relative" aria-hidden="true">
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 30, scale: 0.96 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 mb-4">
              <TbPill className="text-cyanAccent shrink-0" size={16} />
              <span className="text-xs text-landingGray">Search medicines near you…</span>
            </div>

            <div className="space-y-2.5">
              {MOCK_ROWS.map((row) => (
                <div key={row.name} className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electricBlue/30 to-lavender/30 text-cyanAccent flex items-center justify-center shrink-0">
                    <TbPill className="w-5 h-5 transform -rotate-45" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{row.name}</p>
                    <p className="text-[11px] font-medium text-cyanAccent">{row.tag}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {FLOATING_BADGES.map(({ icon: Icon, label, className, delay }) => (
            <motion.div
              key={label}
              initial={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + delay, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute ${className} flex items-center gap-1.5 bg-midnight/90 backdrop-blur-xl border border-white/10 rounded-full px-3.5 py-2 shadow-xl animate-float`}
              style={{ animationDelay: `${delay}s` }}
            >
              <Icon className="text-cyanAccent shrink-0" size={14} />
              <span className="text-[11px] font-semibold text-white whitespace-nowrap">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Soft fade into the next (light) section */}
      <div className="h-24 bg-gradient-to-b from-transparent to-landingOffWhite" aria-hidden="true" />
    </section>
  );
};

export default HeroSection;
