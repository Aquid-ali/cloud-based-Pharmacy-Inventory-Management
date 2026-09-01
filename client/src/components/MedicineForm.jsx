import React, { useState } from 'react';

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

const toDateInputValue = (value) => (value ? String(value).slice(0, 10) : '');

const buildInitialForm = (initialData) => ({
  medicineName: initialData?.medicineName || '',
  genericName: initialData?.genericName || '',
  manufacturer: initialData?.manufacturer || '',
  category: initialData?.category || '',
  batchNumber: initialData?.batchNumber || '',
  expiryDate: toDateInputValue(initialData?.expiryDate),
  manufacturingDate: toDateInputValue(initialData?.manufacturingDate),
  quantity: initialData?.quantity ?? '',
  buyingPrice: initialData?.buyingPrice ?? '',
  sellingPrice: initialData?.sellingPrice ?? '',
  supplier: initialData?.supplier || '',
  description: initialData?.description || '',
});

const REQUIRED_FIELDS = [
  'medicineName',
  'manufacturer',
  'category',
  'batchNumber',
  'expiryDate',
  'quantity',
  'buyingPrice',
  'sellingPrice',
];

const MedicineForm = ({ initialData, onSubmit, submitting, submitLabel = 'Save Medicine' }) => {
  const [form, setForm] = useState(() => buildInitialForm(initialData));
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (form[field] === '' || form[field] === null || form[field] === undefined) {
        errs[field] = 'This field is required';
      }
    });
    if (form.quantity !== '' && Number(form.quantity) < 0) errs.quantity = 'Quantity cannot be negative';
    if (form.buyingPrice !== '' && Number(form.buyingPrice) < 0) errs.buyingPrice = 'Price cannot be negative';
    if (form.sellingPrice !== '' && Number(form.sellingPrice) < 0) errs.sellingPrice = 'Price cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
      manufacturingDate: form.manufacturingDate || undefined,
    };
    onSubmit(payload);
  };

  const isEdit = Boolean(initialData);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6" noValidate>
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
            onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
            placeholder="e.g. BATCH-2026-99"
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 font-mono ${
              errors.batchNumber ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.batchNumber && <p className="text-xs text-red-500 mt-1 pl-1">{errors.batchNumber}</p>}
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Supplier
          </label>
          <input
            type="text"
            name="supplier"
            value={form.supplier}
            onChange={handleChange}
            placeholder="e.g. Global Med Supply"
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400"
          />
        </div>

        {/* Manufacturing Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Manufacturing Date
          </label>
          <input
            type="date"
            name="manufacturingDate"
            value={form.manufacturingDate}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 text-slate-700"
          />
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
            onChange={handleChange}
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
            onChange={handleChange}
            placeholder="0"
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 ${
              errors.quantity ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.quantity && <p className="text-xs text-red-500 mt-1 pl-1">{errors.quantity}</p>}
        </div>

        {/* Buying Price */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Buying Price (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="buyingPrice"
            value={form.buyingPrice}
            onChange={handleChange}
            placeholder="0.00"
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 ${
              errors.buyingPrice ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.buyingPrice && <p className="text-xs text-red-500 mt-1 pl-1">{errors.buyingPrice}</p>}
        </div>

        {/* Selling Price */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Selling Price (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="sellingPrice"
            value={form.sellingPrice}
            onChange={handleChange}
            placeholder="0.00"
            className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 ${
              errors.sellingPrice ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.sellingPrice && <p className="text-xs text-red-500 mt-1 pl-1">{errors.sellingPrice}</p>}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            maxLength={1000}
            placeholder="Optional notes about this medicine"
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 resize-none"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#346560] hover:bg-[#2b5450] disabled:opacity-60 text-white font-medium py-3 px-8 rounded-2xl text-sm transition-all shadow-lg shadow-[#346560]/20"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Medicine' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default MedicineForm;
