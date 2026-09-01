import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { HEALTHCARE_TIPS } from '../../data/landingContent';

const TipCard = ({ title, description, details }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">{description}</p>
      {expanded && <p className="text-xs text-ink-soft mt-2 leading-relaxed">{details}</p>}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-3 self-start flex items-center gap-1 text-xs font-semibold text-tealPrimary hover:text-tealHover"
      >
        {expanded ? 'Show Less' : 'Read More'}
        {expanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
      </button>
    </div>
  );
};

const HealthcareTipsSection = () => (
  <section id="healthcare-tips" className="w-full px-4 sm:px-6 lg:px-10 py-14 scroll-mt-20">
    <div className="text-center max-w-xl mx-auto mb-10">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Healthcare Tips</h2>
      <p className="text-sm text-ink-soft mt-2">General wellness guidance for everyday health.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
      {HEALTHCARE_TIPS.map((tip) => (
        <TipCard key={tip.title} {...tip} />
      ))}
    </div>
  </section>
);

export default HealthcareTipsSection;
