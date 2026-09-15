import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/**
 * URL-driven tab strip (real routes, not internal state) so each view is
 * deep-linkable - Inbox / Find Pharmacies / Requests for the Pharmacy
 * Network section. Hidden on mobile whenever a conversation is open, same
 * as PharmacyMessages.jsx's showListOnMobile convention.
 */
// Order matters: Find/Requests are checked as their own prefixes first, and
// Inbox's ":conversationId" match explicitly excludes both so a path like
// /network/requests only ever lights up one tab, never two at once.
const TABS = [
  {
    label: 'Inbox',
    to: '/network',
    match: (path) =>
      path === '/network' ||
      (/^\/network\/[^/]+$/.test(path) && !path.startsWith('/network/find') && !path.startsWith('/network/requests')),
  },
  { label: 'Find Pharmacies', to: '/network/find', match: (path) => path.startsWith('/network/find') },
  { label: 'Requests', to: '/network/requests', match: (path) => path.startsWith('/network/requests') },
];

const NetworkTabNav = ({ pendingRequestCount = 0, hideOnMobile = false }) => {
  const location = useLocation();

  return (
    <div className={`${hideOnMobile ? 'hidden md:flex' : 'flex'} gap-1.5 border-b border-slate-200`}>
      {TABS.map((tab) => {
        const active = tab.match(location.pathname);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`relative px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors ${
              active ? 'text-brandPrimary border-b-2 border-brandPrimary' : 'text-ink-faint hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.label === 'Requests' && pendingRequestCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};

export default NetworkTabNav;
