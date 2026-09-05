import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Reveal, StaggerGroup, StaggerItem } from './motion';
import { PHARMACY_OWNER_BENEFITS } from '../../data/landingContent';

const PharmacyOwnerSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pharmacy-owners" className="relative bg-midnight py-20 sm:py-28 overflow-hidden scroll-mt-[72px]">
      <div
        className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-lavender/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative w-full px-4 sm:px-6 lg:px-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <Reveal>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-white/5 text-lavender text-xs font-semibold border border-white/10">
                For Pharmacy Owners
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-5 leading-tight">
                Bring your pharmacy into the digital age
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-landingGray text-sm sm:text-base mt-4 max-w-md leading-relaxed">
                Join a growing network of pharmacies reaching customers online — manage stock, orders, and customer
                conversations from one place.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <button
                onClick={() => navigate('/admin/register')}
                className="flex items-center gap-2 bg-gradient-to-r from-electricBlue to-lavender hover:opacity-90 text-white text-sm font-semibold px-6 py-3.5 rounded-full transition-opacity shadow-lg shadow-lavender/20 mt-8"
              >
                Register Your Pharmacy <FiArrowRight size={16} />
              </button>
            </Reveal>
          </div>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PHARMACY_OWNER_BENEFITS.map(({ title, description, icon: Icon }) => (
              <StaggerItem key={title}>
                <div className="h-full rounded-2xl bg-white/[0.04] border border-white/10 p-5 hover:bg-white/[0.06] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-cyanAccent flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-white mt-3.5">{title}</h3>
                  <p className="text-xs text-landingGray mt-1.5 leading-relaxed">{description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
};

export default PharmacyOwnerSection;
