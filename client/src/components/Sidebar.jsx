import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import { navigation } from '../config/navigation';
import useUnreadCount from '../hooks/useUnreadCount';

/**
 * Single row renderer for every nav item - previously duplicated between
 * top-level items (NavLink's own isActive) and child items (a hand-rolled
 * isChildActive check), now unified on one manual `active` check passed in
 * from the parent. `primary` drives the two-tier visual hierarchy (Main
 * section vs. every other section) without hiding or collapsing anything.
 */
const NavItem = ({ to, icon: Icon, label, active, badge, primary, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`group flex items-center gap-3 rounded-xl border transition-colors duration-150 ${
      primary ? 'px-3.5 py-2.5 text-[15px]' : 'ml-2 px-3 py-2 text-[13.5px]'
    } font-medium ${
      active
        ? 'bg-accentCyan/10 border-accentCyan/20 text-accentCyan'
        : 'border-transparent text-white/65 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon size={primary ? 19 : 18} className="shrink-0" />
    <span className="flex-1 truncate">{label}</span>
    {badge > 0 && (
      <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </NavLink>
);

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const unreadCount = useUnreadCount();

  // One matching rule for every item: exact match or a nested route beneath
  // it (e.g. `/medicines` also lights up for `/medicines/add`,
  // `/medicines/edit/:id`, `/medicines/:id`).
  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-midnight/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-40 lg:static top-0 left-0 h-full w-[268px] max-w-[80vw] bg-brandDark text-white transform transition-transform duration-200 lg:translate-x-0 flex flex-col overflow-hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 px-5 h-[76px] border-b border-white/8 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brandPrimary to-lavender flex items-center justify-center text-white shadow-sm shrink-0">
              <TbPill className="w-6 h-6 transform -rotate-45" />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="font-display text-lg font-bold text-white tracking-tight block truncate">
                MedStock
              </span>
              <span className="text-accentCyan text-[11px] font-medium tracking-wide">Pharmacy Cloud</span>
            </div>
          </div>
          <button
            className="lg:hidden text-white/60 hover:text-white shrink-0 p-1"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Nav - every item always visible, grouped into sections with a
            subtle divider between groups instead of expand/collapse controls. */}
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-5" aria-label="Sidebar">
          {navigation.map((group, i) => (
            <div key={group.section} className={i === 0 ? '' : 'mt-5 pt-5 border-t border-white/8'}>
              <p className="px-3.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.to)}
                    primary={group.variant === 'primary'}
                    badge={item.to === '/messages' ? unreadCount : 0}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 m-3 rounded-2xl bg-brandCard border border-white/8 text-sm text-white/70 shrink-0">
          <p className="font-semibold text-white mb-0.5">MedStock Cloud v1.0</p>
          <p className="text-xs text-white/50">Encrypted JWT Authentication</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
