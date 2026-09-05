import React from 'react';
import LandingNavbar from './LandingNavbar';
import LandingFooter from './LandingFooter';

const InfoPageLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-canvas flex flex-col">
    <LandingNavbar alwaysSolid />
    {/* pt-[72px] accounts for LandingNavbar being fixed (overlaying content
        with no offset of its own) - without it, this page's heading would
        render hidden behind the navbar. */}
    <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 pt-[72px] pb-14">
      <div className="max-w-3xl mx-auto pt-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-ink-soft mt-2">{subtitle}</p>}
        <div className="mt-8 space-y-6">{children}</div>
      </div>
    </main>
    <LandingFooter />
  </div>
);

export default InfoPageLayout;
