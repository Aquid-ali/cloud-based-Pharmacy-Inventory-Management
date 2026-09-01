import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../data/landingContent';

const CategorySection = () => (
  <section id="categories" className="w-full px-4 sm:px-6 lg:px-10 py-14 scroll-mt-20">
    <div className="text-center max-w-xl mx-auto mb-10">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Medicine &amp; Healthcare Categories</h2>
      <p className="text-sm text-ink-soft mt-2">Browse by what you need, and see real results from our medicine catalog.</p>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {CATEGORIES.map(({ name, query, icon: Icon }) => (
        <Link
          key={name}
          to={`/customer/medicines?q=${encodeURIComponent(query)}`}
          className="group flex flex-col items-center text-center gap-3 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-tealPrimary/30 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-tealPrimary flex items-center justify-center group-hover:bg-tealPrimary group-hover:text-white transition-colors">
            <Icon size={22} />
          </div>
          <span className="text-xs font-semibold text-ink">{name}</span>
        </Link>
      ))}
    </div>
  </section>
);

export default CategorySection;
