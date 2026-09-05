import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Reveal } from './motion';
import useAuth from '../../hooks/useAuth';

const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative bg-gradient-to-br from-midnight via-deepBlue to-midnight py-24 sm:py-28 overflow-hidden">
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-electricBlue/15 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative w-full px-4 sm:px-6 lg:px-10 max-w-2xl mx-auto text-center">
        <Reveal>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Your pharmacy is closer than you think
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-landingGray text-sm sm:text-base mt-5 max-w-lg mx-auto leading-relaxed">
            Search real medicines, find pharmacies that actually stock them, and connect directly — all in one
            place.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
            <button
              onClick={() => navigate('/shop/stores')}
              className="flex items-center gap-2 bg-gradient-to-r from-electricBlue to-lavender hover:opacity-90 text-white text-sm font-semibold px-7 py-3.5 rounded-full transition-opacity shadow-lg shadow-electricBlue/20"
            >
              Find a Pharmacy <FiArrowRight size={16} />
            </button>
            {user?.role !== 'Admin' && (
              <button
                onClick={() => navigate('/admin/register')}
                className="bg-white/5 hover:bg-white/10 text-white text-sm font-semibold px-7 py-3.5 rounded-full border border-white/15 transition-colors"
              >
                Join as a Pharmacy
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTASection;
