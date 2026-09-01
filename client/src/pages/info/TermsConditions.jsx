import React from 'react';
import InfoPageLayout from '../../components/landing/InfoPageLayout';

const TermsConditions = () => (
  <InfoPageLayout
    title="Terms & Conditions"
    subtitle="MedStock is a demonstration project. These terms describe expected usage of the platform rather than a formal legal agreement."
  >
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5 text-sm text-slate-600 leading-relaxed">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Medical information</h3>
        <p>Medicine information on this platform is provided for reference only and is not medical advice. Always consult a qualified doctor or pharmacist before taking any medicine.</p>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Accounts</h3>
        <p>You are responsible for keeping your login credentials confidential. Customer and pharmacy admin accounts are separate and have different permissions.</p>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Orders and stock</h3>
        <p>Displayed stock and pricing reflect what pharmacies have entered into the system, and may change between browsing and checkout.</p>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Demo content</h3>
        <p>Testimonials and some illustrative content on this site are provided for demonstration purposes and do not represent verified real customers.</p>
      </div>
    </div>
  </InfoPageLayout>
);

export default TermsConditions;
