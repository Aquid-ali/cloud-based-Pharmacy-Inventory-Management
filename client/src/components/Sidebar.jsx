import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import { navigation } from '../config/navigation';
import useUnreadCount from '../hooks/useUnreadCount';

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const unreadCount = useUnreadCount();
  const [expanded, setExpanded] = useState(() => {
    const initial = {};
    navigation.forEach((item) => {
      if (item.children?.some((child) => location.pathname.startsWith(child.to.split('/').slice(0, 2).join('/')) || location.pathname === child.to)) {
        initial[item.label] = true;
      }
    });
    return initial;
  });

  const toggleSection = (label) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isChildActive = (to) => {
    if (to === '/medicines') {
      return location.pathname === '/medicines' || location.pathname.startsWith('/medicines/');
    }
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const isSectionActive = (item) => {
    if (item.to) return location.pathname === item.to;
    return item.children?.some((child) => isChildActive(child.to));
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-midnight/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-40 lg:static top-0 left-0 h-full w-72 bg-brandDark text-white transform transition-transform duration-200 lg:translate-x-0 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brandPrimary to-lavender flex items-center justify-center text-white shadow-sm">
              <TbPill className="w-6 h-6 transform -rotate-45" />
            </div>
            <div>
              <span className="font-display text-xl font-bold text-white tracking-tight leading-none block">
                MedStock
              </span>
              <span className="text-accentCyan text-xs font-medium tracking-wide">
                Pharmacy Cloud
              </span>
            </div>
          </div>
          <button className="lg:hidden text-white/70 hover:text-white" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <nav className="mt-4 px-3 flex-1 overflow-y-auto pb-4 scrollbar-thin">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              if (item.to) {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-white/10 text-accentCyan border border-accentCyan/20 shadow-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon size={19} />
                    <span className="flex-1">{item.label}</span>
                    {item.to === '/messages' && unreadCount > 0 && (
                      <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </NavLink>
                );
              }

              const SectionIcon = item.icon;
              const isOpen = expanded[item.label];
              const sectionActive = isSectionActive(item);

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium transition-colors duration-150 ${
                      sectionActive
                        ? 'text-accentCyan'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <SectionIcon size={19} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                  </button>

                  {isOpen && (
                    <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5 mt-0.5 mb-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const active = isChildActive(child.to);
                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            end={child.to === '/medicines'}
                            onClick={onClose}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                              active
                                ? 'bg-white/10 text-accentCyan'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                            }`}
                          >
                            <ChildIcon size={16} />
                            <span>{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="p-4 m-3 rounded-2xl bg-brandCard border border-white/10 text-sm text-white/70 shrink-0">
          <p className="font-semibold text-white mb-0.5">MedStock Cloud v1.0</p>
          <p className="text-xs text-white/50">Encrypted JWT Authentication</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
