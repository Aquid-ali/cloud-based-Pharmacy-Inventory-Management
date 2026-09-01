import React from 'react';
import InfoPageLayout from '../../components/landing/InfoPageLayout';

const PrivacyPolicy = () => (
  <InfoPageLayout
    title="Privacy Policy"
    subtitle="MedStock is a demonstration project. This page describes how the application handles data in general terms, rather than a formal legal policy."
  >
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5 text-sm text-slate-600 leading-relaxed">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">What we store</h3>
        <p>Account details you provide at registration (name, email, phone, addresses), your order history, and cart contents while you shop.</p>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">How accounts are protected</h3>
        <p>Passwords are hashed before storage and never stored in plain text. Sessions use signed JWT tokens rather than storing credentials in the browser.</p>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Pharmacy data isolation</h3>
        <p>A pharmacy's inventory and order details are only accessible to that pharmacy's own admin account, never to other pharmacies.</p>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Third parties</h3>
        <p>Medicine information may be enriched using an AI provider on the backend; your personal account data is never sent to it.</p>
      </div>
    </div>
  </InfoPageLayout>
);

export default PrivacyPolicy;
