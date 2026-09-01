import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import InfoPageLayout from '../../components/landing/InfoPageLayout';

const FAQ_ITEMS = [
  {
    q: 'How do I search for a medicine?',
    a: 'Use the search bar on the homepage or the Medicines page. You can search by medicine name, composition, manufacturer, or even a condition it treats (e.g. "fever" or "diabetes").',
  },
  {
    q: 'Why do I need to log in to see medicine availability?',
    a: 'Pharmacy availability and ordering are tied to your account so we can show accurate stock and manage your orders. You can browse healthcare information and categories from the homepage without logging in.',
  },
  {
    q: 'How is medicine information verified?',
    a: 'Medicine details are matched against a reference dataset where possible, and clearly marked as pending verification when they are not. We never display invented medical information as if it were verified.',
  },
  {
    q: 'Can multiple pharmacies stock the same medicine?',
    a: 'Yes. A medicine\'s general information (composition, uses, side effects) is shared, while each pharmacy maintains its own stock, batch, and pricing for it.',
  },
  {
    q: 'Is this a real pharmacy?',
    a: 'MedStock is a demo pharmacy inventory and availability platform. Testimonials and some content on this site are illustrative rather than from real customers.',
  },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-800">{q}</span>
        <FiChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-4 text-xs text-slate-500 leading-relaxed">{a}</p>}
    </div>
  );
};

const FAQs = () => (
  <InfoPageLayout title="Frequently Asked Questions">
    <div className="space-y-3">
      {FAQ_ITEMS.map((item) => (
        <FAQItem key={item.q} {...item} />
      ))}
    </div>
  </InfoPageLayout>
);

export default FAQs;
