import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiHelpCircle } from 'react-icons/fi';
import InfoPageLayout from '../../components/landing/InfoPageLayout';

const ContactUs = () => (
  <InfoPageLayout
    title="Contact Us"
    subtitle="This is a demo pharmacy platform, so contact details below point back into the product rather than a real support line."
  >
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex items-start gap-4">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-[#f0f7f6] text-[#346560] flex items-center justify-center">
        <FiMapPin size={18} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">Have a question about a specific pharmacy?</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Each pharmacy's address and details are listed on its own page.
        </p>
        <Link to="/shop/stores" className="inline-block mt-3 text-xs font-semibold text-[#346560] hover:text-[#2b5450]">
          Browse Pharmacies →
        </Link>
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex items-start gap-4">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-[#f0f7f6] text-[#346560] flex items-center justify-center">
        <FiHelpCircle size={18} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">General questions</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Check our FAQs for answers about searching, ordering, and accounts.
        </p>
        <Link to="/faqs" className="inline-block mt-3 text-xs font-semibold text-[#346560] hover:text-[#2b5450]">
          View FAQs →
        </Link>
      </div>
    </div>
  </InfoPageLayout>
);

export default ContactUs;
