import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiGrid } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import { stockTextTint } from '../../utils/stockStatus';

const PREVIEW_ROWS = [
  { name: 'Azithromycin 500mg', manufacturer: 'Cipla', status: 'In Stock', price: '84.00' },
  { name: 'Metformin 500mg', manufacturer: 'Sun Pharma', status: 'Low Stock', price: '32.50' },
  { name: 'Cetirizine 10mg', manufacturer: 'Dr. Reddy\'s', status: 'In Stock', price: '18.00' },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/customer/medicines?q=${encodeURIComponent(query.trim())}` : '/customer/medicines');
  };

  return (
    <section className="bg-primary-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Copy + search */}
        <div className="min-w-0 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-tealPrimary text-xs font-semibold border border-tealPrimary/15 mb-6">
            Online Pharmacy &amp; Healthcare Platform
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-[1.1]">
            Your Health, Our Priority
          </h1>
          <p className="text-ink-soft text-sm sm:text-base mt-4 leading-relaxed">
            Order medicines, discover healthcare essentials, and get reliable health information — all in one place.
          </p>

          <form onSubmit={handleSearch} className="w-full mt-8">
            <div className="relative bg-white rounded-2xl shadow-lg shadow-slate-200/60 p-2 flex items-center gap-2 border border-slate-100">
              <FiSearch className="ml-3 text-slate-400 shrink-0" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for medicines, health products or conditions..."
                className="flex-1 min-w-0 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 bg-tealPrimary hover:bg-tealHover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => navigate('/customer/medicines')}
              className="flex items-center gap-2 bg-tealPrimary hover:bg-tealHover text-white text-sm font-semibold px-6 py-3 rounded-2xl transition-colors"
            >
              <FiSearch size={16} /> Search Medicines
            </button>
            <a
              href="#categories"
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-tealPrimary text-sm font-semibold px-6 py-3 rounded-2xl border border-tealPrimary/20 transition-colors"
            >
              <FiGrid size={16} /> Explore Categories
            </a>
          </div>
        </div>

        {/* Product interface preview — a stylized snapshot of the real
            search-results view, not a decorative illustration. */}
        <div className="hidden lg:block" aria-hidden="true">
          <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xl shadow-slate-900/5 p-5 rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-4">
              <FiSearch className="text-slate-300" size={14} />
              <span className="text-xs text-slate-400">azithromycin</span>
            </div>

            <div className="space-y-2.5">
              {PREVIEW_ROWS.map((row) => (
                <div key={row.name} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-tealPrimary flex items-center justify-center shrink-0">
                    <TbPill className="w-5 h-5 transform -rotate-45" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{row.name}</p>
                    <p className={`text-[11px] font-medium ${stockTextTint[row.status]}`}>{row.status}</p>
                  </div>
                  <span className="text-xs font-bold text-ink shrink-0">₹{row.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
