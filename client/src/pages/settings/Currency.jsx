import React from 'react';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';

const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1.5';

const Currency = () => {
  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Currency settings updated');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Currency" description="Set default currency, symbol, and formatting preferences." />

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Currency</label>
            <select defaultValue="INR" className={inputClass}>
              <option value="INR">Indian Rupee (INR)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">British Pound (GBP)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Currency Symbol</label>
            <input type="text" defaultValue="₹" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Decimal Places</label>
            <select defaultValue="2" className={inputClass}>
              <option value="0">0</option>
              <option value="2">2</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Number Format</label>
            <select defaultValue="indian" className={inputClass}>
              <option value="indian">Indian (1,00,000)</option>
              <option value="international">International (100,000)</option>
            </select>
          </div>
        </div>
        <button type="submit" className="px-5 py-2.5 bg-[#346560] text-white rounded-2xl text-sm font-semibold hover:bg-[#2a524e] transition-colors">
          Save Currency Settings
        </button>
      </form>
    </div>
  );
};

export default Currency;
