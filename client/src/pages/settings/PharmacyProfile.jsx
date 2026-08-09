import React from 'react';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';

const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1.5';

const PharmacyProfile = () => {
  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Pharmacy profile updated');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pharmacy Profile" description="Manage your pharmacy business information and branding." />

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Pharmacy Name</label>
            <input type="text" defaultValue="MedStock Pharmacy" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>License Number</label>
            <input type="text" defaultValue="PH-2024-001234" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" defaultValue="contact@medstock.com" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" defaultValue="+91 98765 43210" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <textarea rows={2} defaultValue="123 Health Street, Medical District, Mumbai 400001" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>GST Number</label>
            <input type="text" defaultValue="27AABCM1234A1Z5" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Operating Hours</label>
            <input type="text" defaultValue="8:00 AM - 10:00 PM" className={inputClass} />
          </div>
        </div>
        <button type="submit" className="px-5 py-2.5 bg-[#346560] text-white rounded-2xl text-sm font-semibold hover:bg-[#2a524e] transition-colors">
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default PharmacyProfile;
