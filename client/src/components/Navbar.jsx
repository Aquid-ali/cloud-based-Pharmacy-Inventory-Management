import React from 'react';
import { FiMenu, FiLogOut, FiUser } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <button className="lg:hidden text-slate-600 hover:text-slate-900 p-1" onClick={onMenuClick}>
        <FiMenu size={22} />
      </button>

      <div className="hidden lg:block text-xs font-medium text-slate-400">
        Pharmacy Inventory Management
      </div>

      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="flex items-center gap-3 bg-[#f0f7f6] py-1.5 px-3 rounded-2xl border border-[#346560]/10">
          <div className="w-7 h-7 rounded-xl bg-[#346560] text-white flex items-center justify-center text-xs font-bold">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="text-left">
            <span className="font-semibold text-slate-800 text-xs block leading-tight">
              {user?.fullName}
            </span>
            <span className="text-[10px] text-[#346560] font-medium leading-none">
              {user?.role === 'Admin' && (user?.pharmacyId?.name || user?.store?.name)
                ? user.pharmacyId?.name || user.store?.name
                : user?.role}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50"
        >
          <FiLogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
