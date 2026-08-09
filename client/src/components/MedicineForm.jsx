import React from 'react';

const CATEGORIES = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment',
  'Drops',
  'Inhaler',
  'Other',
];

const MedicineForm = ({ form, errors, onChange, onSubmit, loading, isEdit }) => {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Medicine Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Medicine Name *
          </label>
          <input
            type="text"
            name="medicineName"
            value={form.medicineName}
            onChange={onChange}
            placeholder="e.g. Paracetamol Extra"
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 ${
              errors.medicineName ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.medicineName && <p className="text-xs text-red-500 mt-1 pl-1">{errors.medicineName}</p>}
        </div>

        {/* Generic Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Generic Name
          </label>
          <input
            type="text"
            name="genericName"
            value={form.genericName}
            onChange={onChange}
            placeholder="e.g. Acetaminophen"
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400"
          />
        </div>

        {/* Manufacturer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Manufacturer *
          </label>
          <input
            type="text"
            name="manufacturer"
            value={form.manufacturer}
            onChange={onChange}
            placeholder="e.g. Pfizer Inc"
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 ${
              errors.manufacturer ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.manufacturer && <p className="text-xs text-red-500 mt-1 pl-1">{errors.manufacturer}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Category *
          </label>
          <select
            name="category"
            value={form.category}
            onChange={onChange}
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 text-slate-700 bg-white cursor-pointer ${
              errors.category ? 'border-red-400' : 'border-slate-200'
            }`}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1 pl-1">{errors.category}</p>}
        </div>

        {/* Batch Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Batch Number *
          </label>
          <input
            type="text"
            name="batchNumber"
            value={form.batchNumber}
            onChange={onChange}
            placeholder="e.g. BATCH-2026-99"
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 font-mono ${
              errors.batchNumber ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.batchNumber && <p className="text-xs text-red-500 mt-1 pl-1">{errors.batchNumber}</p>}
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Expiry Date *
          </label>
          <input
            type="date"
            name="expiryDate"
            value={form.expiryDate}
            onChange={onChange}
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 text-slate-700 ${
              errors.expiryDate ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.expiryDate && <p className="text-xs text-red-500 mt-1 pl-1">{errors.expiryDate}</p>}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Quantity *
          </label>
          <input
            type="number"
            min="0"
            name="quantity"
            value={form.quantity}
            onChange={onChange}
            placeholder="0"
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 ${
              errors.quantity ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.quantity && <p className="text-xs text-red-500 mt-1 pl-1">{errors.quantity}</p>}
        </div>

        {/* Selling Price */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Selling Price ($) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="sellingPrice"
            value={form.sellingPrice}
            onChange={onChange}
            placeholder="0.00"
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 ${
              errors.sellingPrice ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.sellingPrice && <p className="text-xs text-red-500 mt-1 pl-1">{errors.sellingPrice}</p>}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#346560] hover:bg-[#2b5450] disabled:opacity-60 text-white font-medium py-3 px-8 rounded-2xl text-sm transition-all shadow-lg shadow-[#346560]/20"
        >
          {loading ? 'Saving...' : isEdit ? 'Update Medicine' : 'Add Medicine'}
        </button>
      </div>
    </form>
  );
};

export default MedicineForm;
