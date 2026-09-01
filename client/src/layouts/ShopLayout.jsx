import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiMapPin, FiUser, FiLogOut, FiPackage, FiChevronDown, FiBookOpen } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';

const ShopLayout = () => {
  const { user, logout } = useAuth();
  const { count, pharmacyName, clearPharmacy } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!user) {
      navigate(q ? `/customer/medicines?q=${encodeURIComponent(q)}` : '/customer/medicines');
      return;
    }
    navigate(q ? `/shop/search?q=${encodeURIComponent(q)}` : '/shop/search');
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-tealPrimary sticky top-0 z-30 shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Logo + deliver-to */}
          <div className="flex items-center gap-4 shrink-0">
            <Link to="/shop" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-mintAccent">
                <TbPill className="w-5 h-5 transform -rotate-45" />
              </div>
              <span className="font-serif text-xl font-bold text-white tracking-tight">MedStock</span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <Link to="/shop/stores" className="flex items-center gap-1 text-white/90 hover:text-white text-xs">
                <FiMapPin size={14} />
                <span>
                  {pharmacyName ? (
                    <>Shopping from <span className="font-semibold">{pharmacyName}</span></>
                  ) : (
                    <span className="underline">Choose a pharmacy</span>
                  )}
                </span>
              </Link>
              {pharmacyName && (
                <button
                  onClick={() => {
                    if (clearPharmacy()) navigate('/shop');
                  }}
                  title="Browse medicines from all pharmacies"
                  className="text-white/50 hover:text-white text-xs underline underline-offset-2"
                >
                  browse all
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for medicines..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm border-0 focus:outline-none focus:ring-4 focus:ring-white/20"
              />
            </div>
          </form>

          {/* Cart + account */}
          <div className="flex items-center gap-2 shrink-0 justify-end">
            <Link
              to="/shop/stores"
              className="hidden sm:flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-medium px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <FiMapPin size={16} />
              Pharmacies
            </Link>

            <Link
              to="/customer/medicines"
              className="hidden sm:flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-medium px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <FiBookOpen size={16} />
              Medicine Info
            </Link>

            <Link
              to="/shop/cart"
              className="relative flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-medium px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <FiShoppingCart size={18} />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-mintAccent text-brandDark text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-mintAccent text-brandDark flex items-center justify-center text-[11px] font-bold">
                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.fullName}</span>
                  <FiChevronDown size={14} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 text-sm">
                    <NavLink
                      to="/shop/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"
                    >
                      <FiPackage size={15} /> My Orders
                    </NavLink>
                    <NavLink
                      to="/shop/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"
                    >
                      <FiUser size={15} /> Account
                    </NavLink>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <FiLogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                state={{ from: location }}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
              >
                <FiUser size={14} /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-10 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default ShopLayout;
