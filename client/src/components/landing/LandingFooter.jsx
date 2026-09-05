import React from 'react';
import { Link } from 'react-router-dom';
import { TbPill } from 'react-icons/tb';
import { FOOTER_LINKS } from '../../data/landingContent';

const LandingFooter = () => (
  <footer className="bg-midnight text-landingGray border-t border-white/5">
    <div className="w-full px-4 sm:px-6 lg:px-10 py-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
      <div className="col-span-2 sm:col-span-3 lg:col-span-2">
        <Link to="/" className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electricBlue to-lavender flex items-center justify-center text-white">
            <TbPill className="w-5 h-5 transform -rotate-45" />
          </div>
          <span className="font-display text-lg font-extrabold text-white">MedStock</span>
        </Link>
        <p className="text-xs leading-relaxed max-w-xs">
          A searchable medicine catalog connected to real pharmacy stock, location, and direct messaging — find what
          you need, and reach the pharmacy that has it.
        </p>
      </div>

      {Object.entries(FOOTER_LINKS).map(([section, links]) => (
        <div key={section}>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3.5">{section}</h4>
          <ul className="space-y-2.5">
            {links.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-xs hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="border-t border-white/5 px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
      <p>© {new Date().getFullYear()} MedStock Pharmacy Cloud. All rights reserved.</p>
      <p className="text-white/30">Demo project for illustrative purposes.</p>
    </div>
  </footer>
);

export default LandingFooter;
