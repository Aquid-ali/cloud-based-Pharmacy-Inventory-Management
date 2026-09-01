import React, { useState, useRef } from 'react';

/**
 * Minimal accessible tabs (no headless-UI dependency, matching the app's
 * lean dependency list). `tabs` is [{ id, label, content }].
 */
const Tabs = ({ tabs, defaultTab }) => {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);
  const tabRefs = useRef([]);

  const onKeyDown = (e, index) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  const activeTab = tabs.find((t) => t.id === active) || tabs[0];

  return (
    <div>
      <div role="tablist" className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[i] = el)}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              active === tab.id
                ? 'border-tealPrimary text-tealPrimary'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab.id}`}
        aria-labelledby={`tab-${activeTab.id}`}
        className="pt-5"
      >
        {activeTab.content}
      </div>
    </div>
  );
};

export default Tabs;
