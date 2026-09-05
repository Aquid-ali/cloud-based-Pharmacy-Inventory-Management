import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowRight } from 'react-icons/fi';
import { Reveal, StaggerGroup, StaggerItem } from './motion';
import { CATEGORIES } from '../../data/landingContent';

const QUICK_CATEGORIES = CATEGORIES.slice(0, 8);

const MedicineSearchSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/customer/medicines?q=${encodeURIComponent(query.trim())}` : '/customer/medicines');
  };

  return (
    <section className="relative bg-landingOffWhite pt-4 pb-20 sm:pb-24">
      <div className="w-full px-4 sm:px-6 lg:px-10 max-w-3xl mx-auto text-center">
        <Reveal>
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-electricBlue/10 text-electricBlue text-xs font-semibold">
            Start Here
          </span>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-5 leading-tight">
            What medicine are you looking for?
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-slate-500 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Search by name, composition, or condition — we&apos;ll show you real pharmacies that have it in stock.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <form onSubmit={handleSearch} className="w-full mt-8">
            <div
              className={`relative bg-white rounded-2xl p-2 flex items-center gap-2 border-2 transition-all duration-200 ${
                focused
                  ? 'border-electricBlue shadow-[0_0_0_6px_rgba(59,130,246,0.12)]'
                  : 'border-slate-200 shadow-lg shadow-slate-200/60'
              }`}
            >
              <FiSearch className="ml-3 text-slate-400 shrink-0" size={19} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="e.g. Paracetamol, cold &amp; cough, diabetes…"
                className="flex-1 min-w-0 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
              <button
                type="submit"
                className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-electricBlue to-lavender hover:opacity-90 text-white text-sm font-semibold px-5 sm:px-6 py-3 rounded-xl transition-opacity"
              >
                Search <FiArrowRight size={15} />
              </button>
            </div>
          </form>
        </Reveal>

        <StaggerGroup className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {QUICK_CATEGORIES.map(({ name, query: catQuery, icon: Icon }) => (
            <StaggerItem key={name}>
              <button
                onClick={() => navigate(`/customer/medicines?q=${encodeURIComponent(catQuery)}`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:border-electricBlue/40 hover:text-electricBlue hover:bg-electricBlue/5 transition-colors"
              >
                <Icon size={14} /> {name}
              </button>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
};

export default MedicineSearchSection;
