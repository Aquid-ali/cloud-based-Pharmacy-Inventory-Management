import React from 'react';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';

const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1.5';

const Taxes = () => {
  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Tax settings updated');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Taxes" description="Configure GST rates and tax calculation rules." />

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Default GST Rate (%)</label>
            <input type="number" defaultValue={18} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tax Registration Number</label>
            <input type="text" defaultValue="27AABCM1234A1Z5" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>CGST Rate (%)</label>
            <input type="number" defaultValue={9} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>SGST Rate (%)</label>
            <input type="number" defaultValue={9} className={inputClass} />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-[#346560]" />
            <span className="text-sm text-slate-700">Include tax in displayed prices</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-[#346560]" />
            <span className="text-sm text-slate-700">Auto-calculate tax on invoices</span>
          </label>
        </div>

        <button type="submit" className="px-5 py-2.5 bg-[#346560] text-white rounded-2xl text-sm font-semibold hover:bg-[#2a524e] transition-colors">
          Save Tax Settings
        </button>
      </form>
    </div>
  );
};

export default Taxes;
