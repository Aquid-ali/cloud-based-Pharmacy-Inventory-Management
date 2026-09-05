import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiNavigation } from 'react-icons/fi';
import { Reveal } from './motion';

// Marker positions are purely decorative (percentage coordinates on a
// stylized panel, not real geodata) - the real interactive Google Map with
// live pharmacy locations lives at /shop/stores. Keeping this section as a
// lightweight CSS/SVG illustration avoids loading the Maps JS SDK (and
// incurring its cost) on a public, pre-auth page.
const PULSE_MARKERS = [
  { top: '28%', left: '22%', delay: '0s' },
  { top: '62%', left: '34%', delay: '0.6s' },
  { top: '40%', left: '68%', delay: '1.2s' },
  { top: '74%', left: '78%', delay: '1.8s' },
];

const MapVisualSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-gradient-to-b from-deepBlue to-midnight py-20 sm:py-28 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #94A3B8 1px, transparent 1px), linear-gradient(to bottom, #94A3B8 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full px-4 sm:px-6 lg:px-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="min-w-0">
          <Reveal>
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-white/5 text-cyanAccent text-xs font-semibold border border-white/10">
              Pharmacy Locator
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-5 leading-tight">
              Every pharmacy, mapped and reachable
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-landingGray text-sm sm:text-base mt-4 max-w-md leading-relaxed">
              Use your location to see nearby pharmacies on a live, interactive map — sort by distance, filter your
              search, and get in-app driving, walking, or cycling directions.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <button
              onClick={() => navigate('/shop/stores')}
              className="flex items-center gap-2 bg-white text-midnight text-sm font-semibold px-6 py-3.5 rounded-full hover:bg-landingOffWhite transition-colors mt-8"
            >
              Open Interactive Map <FiArrowRight size={16} />
            </button>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="min-w-0">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03] aspect-[4/3] shadow-2xl shadow-black/40">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.25) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
              aria-hidden="true"
            />

            {PULSE_MARKERS.map((marker, i) => (
              <span
                key={i}
                className="absolute flex items-center justify-center"
                style={{ top: marker.top, left: marker.left }}
                aria-hidden="true"
              >
                <span
                  className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-cyanAccent/70 animate-pulse-ring"
                  style={{ animationDelay: marker.delay }}
                />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyanAccent shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]" />
              </span>
            ))}

            {/* "You" marker - the center reference point, visually distinct from pharmacy pulses */}
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5" aria-hidden="true">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-electricBlue to-lavender shadow-lg shadow-electricBlue/40">
                <FiNavigation size={15} className="text-white" />
              </span>
              <span className="text-[10px] font-semibold text-white/90 bg-black/30 px-2 py-0.5 rounded-full">You</span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default MapVisualSection;
