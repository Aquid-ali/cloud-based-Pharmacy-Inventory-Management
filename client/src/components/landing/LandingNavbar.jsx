import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import useAuth from '../../hooks/useAuth';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Find Medicines', to: '/customer/medicines' },
  { label: 'Pharmacies', to: '/shop/stores' },
  { label: 'For Pharmacies', to: '/#pharmacy-owners' },
  { label: 'Contact', to: '/contact' },
];

/**
 * Transparent over the dark hero at rest, gaining a blurred midnight surface
 * and elevation once the page scrolls past it - reads correctly on white
 * text either way since even the "transparent" state normally sits over the
 * dark hero section. Pages with a light background right at the top (see
 * InfoPageLayout.jsx) pass `alwaysSolid` so the white logo/nav text never
 * renders low-contrast against a light page before the user scrolls.
 */
const LandingNavbar = ({ alwaysSolid = false }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (alwaysSolid) return undefined;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [alwaysSolid]);

  const dashboardPath = user?.role === 'Admin' ? '/dashboard' : '/shop';
  const dashboardLabel = user?.role === 'Admin' ? 'Dashboard' : 'Go to Shop';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        alwaysSolid || scrolled || open
          ? 'bg-midnight/85 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.6)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 h-[72px] flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electricBlue to-lavender flex items-center justify-center text-white shadow-lg shadow-electricBlue/20">
            <TbPill className="w-5 h-5 transform -rotate-45" />
          </div>
          <div className="leading-tight">
            <span className="font-display text-lg font-extrabold text-white tracking-tight block">MedStock</span>
            <span className="text-cyanAccent text-[10px] font-semibold tracking-wide">Pharmacy Cloud</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="px-3.5 py-2 rounded-full text-sm font-medium text-landingGray hover:text-white hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {user ? (
            <Link
              to={dashboardPath}
              className="bg-white text-midnight font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-landingOffWhite transition-colors"
            >
              {dashboardLabel}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-landingGray hover:text-white text-sm font-medium px-3.5 py-2.5 rounded-full hover:bg-white/5 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-electricBlue to-lavender text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-electricBlue/20"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden text-white p-1"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden border-t border-white/10 bg-midnight/95 backdrop-blur-xl"
          >
            <div className="px-4 sm:px-6 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block px-3.5 py-2.5 rounded-xl text-sm font-medium text-landingGray hover:text-white hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2">
                {user ? (
                  <Link
                    to={dashboardPath}
                    onClick={() => setOpen(false)}
                    className="text-center bg-white text-midnight font-semibold text-sm px-5 py-2.5 rounded-full"
                  >
                    {dashboardLabel}
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="text-center text-white text-sm font-medium px-3.5 py-2.5 rounded-full border border-white/15"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="text-center bg-gradient-to-r from-electricBlue to-lavender text-white font-semibold text-sm px-5 py-2.5 rounded-full"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingNavbar;
