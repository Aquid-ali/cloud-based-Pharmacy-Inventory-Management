import React from 'react';
import LandingNavbar from './LandingNavbar';
import LandingFooter from './LandingFooter';

const InfoPageLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-canvas flex flex-col">
    <LandingNavbar />
    <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-14">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-soft mt-2">{subtitle}</p>}
        <div className="mt-8 space-y-6">{children}</div>
      </div>
    </main>
    <LandingFooter />
  </div>
);

export default InfoPageLayout;
