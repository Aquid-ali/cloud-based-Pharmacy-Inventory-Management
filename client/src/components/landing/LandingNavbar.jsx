import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiMenu, FiX } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import useAuth from '../../hooks/useAuth';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Medicines', to: '/customer/medicines' },
  { label: 'Categories', to: '/#categories' },
  { label: 'Healthcare Tips', to: '/#healthcare-tips' },
  { label: 'About Us', to: '/#about' },
  { label: 'Contact Us', to: '/contact' },
];

const LandingNavbar = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const dashboardPath = user?.role === 'Admin' ? '/dashboard' : '/shop';
  const dashboardLabel = user?.role === 'Admin' ? 'Go to Dashboard' : 'Go to Shop';

  return (
    <header className="bg-brandDark sticky top-0 z-40 shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-10 h-18 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-mintAccent">
            <TbPill className="w-5 h-5 transform -rotate-45" />
          </div>
          <div className="leading-tight">
            <span className="font-serif text-lg font-bold text-white tracking-tight block">MedStock</span>
            <span className="text-mintAccent text-[10px] font-medium tracking-wide">Pharmacy Cloud</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Link
            to="/customer/medicines"
            title="Search medicines"
            className="p-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FiSearch size={18} />
          </Link>

          {user ? (
            <Link
              to={dashboardPath}
              className="bg-mintAccent text-brandDark font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-mintHover transition-colors"
            >
              {dashboardLabel}
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="text-white/80 hover:text-white text-sm font-medium px-3.5 py-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="bg-mintAccent text-brandDark font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-mintHover transition-colors"
              >
                Login
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden text-white/80 hover:text-white p-1"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-brandDark px-4 sm:px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <Link
                to={dashboardPath}
                onClick={() => setOpen(false)}
                className="text-center bg-mintAccent text-brandDark font-semibold text-sm px-5 py-2.5 rounded-xl"
              >
                {dashboardLabel}
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="text-center text-white/80 text-sm font-medium px-3.5 py-2.5 rounded-xl border border-white/15"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="text-center bg-mintAccent text-brandDark font-semibold text-sm px-5 py-2.5 rounded-xl"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
