import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';

const buildInitialForm = () => ({
  batchNumber: '',
  quantity: '',
  purchasePrice: '',
  sellingPrice: '',
  expiryDate: '',
  minimumStock: '',
});

const todayInputValue = () => new Date().toISOString().slice(0, 10);

/**
 * Batch-entry form for adding one catalog medicine to the signed-in admin's
 * own pharmacy inventory. `medicine` is a MedicineCatalog record (never an
 * Inventory record) - pharmacyId/medicineId are never entered by the admin,
 * only server-derived/selected-by-click.
 */
const AddStockModal = ({ medicine, onSubmit, submitting, onClose }) => {
  const [form, setForm] = useState(buildInitialForm);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.batchNumber.trim()) errs.batchNumber = 'Batch number is required';
    if (form.quantity === '' || Number(form.quantity) < 0) errs.quantity = 'Enter a valid quantity (0 or more)';
    if (form.purchasePrice === '' || Number(form.purchasePrice) < 0) {
      errs.purchasePrice = 'Enter a valid purchase price';
    }
    if (form.sellingPrice === '' || Number(form.sellingPrice) < 0) {
      errs.sellingPrice = 'Enter a valid selling price';
    }
    if (
      form.purchasePrice !== '' &&
      form.sellingPrice !== '' &&
      Number(form.sellingPrice) < Number(form.purchasePrice)
    ) {
      errs.sellingPrice = 'Selling price cannot be lower than purchase price';
    }
    if (!form.expiryDate) {
      errs.expiryDate = 'Expiry date is required';
    } else if (form.expiryDate <= todayInputValue()) {
      errs.expiryDate = 'Expiry date must be in the future';
    }
    if (form.minimumStock !== '' && Number(form.minimumStock) < 0) {
      errs.minimumStock = 'Minimum stock cannot be negative';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      medicineId: medicine._id,
      batchNumber: form.batchNumber.trim(),
      quantity: Number(form.quantity),
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      expiryDate: form.expiryDate,
      ...(form.minimumStock !== '' ? { minimumStock: Number(form.minimumStock) } : {}),
    });
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400 ${
      errors[field] ? 'border-red-400' : 'border-slate-200'
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in duration-150">
        <div className="flex items-start justify-between gap-4 p-6 sm:p-7 pb-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#f0f7f6] flex items-center justify-center text-[#346560] shrink-0 overflow-hidden">
              {medicine.imageUrl ? (
                <img src={medicine.imageUrl} alt={medicine.name} className="w-full h-full object-contain" />
              ) : (
                <TbPill className="w-5 h-5 transform -rotate-45" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 font-serif truncate">{medicine.name}</h3>
              <p className="text-xs text-slate-500 truncate">{medicine.manufacturer}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 shrink-0 p-1 -mr-1"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Batch Number *
              </label>
              <input
                type="text"
                name="batchNumber"
                value={form.batchNumber}
                onChange={handleChange}
                placeholder="e.g. BATCH-2026-0142"
                className={`${inputClass('batchNumber')} font-mono`}
                autoFocus
              />
              {errors.batchNumber && <p className="text-xs text-red-500 mt-1 pl-1">{errors.batchNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Quantity (Stock) *
              </label>
              <input
                type="number"
                min="0"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0"
                className={inputClass('quantity')}
              />
              {errors.quantity && <p className="text-xs text-red-500 mt-1 pl-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Minimum Stock
              </label>
              <input
                type="number"
                min="0"
                name="minimumStock"
                value={form.minimumStock}
                onChange={handleChange}
                placeholder="10"
                className={inputClass('minimumStock')}
              />
              {errors.minimumStock && <p className="text-xs text-red-500 mt-1 pl-1">{errors.minimumStock}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Purchase Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="purchasePrice"
                value={form.purchasePrice}
                onChange={handleChange}
                placeholder="0.00"
                className={inputClass('purchasePrice')}
              />
              {errors.purchasePrice && <p className="text-xs text-red-500 mt-1 pl-1">{errors.purchasePrice}</p>}
            </div>

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
                className={inputClass('sellingPrice')}
              />
              {errors.sellingPrice && <p className="text-xs text-red-500 mt-1 pl-1">{errors.sellingPrice}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                name="expiryDate"
                min={todayInputValue()}
                value={form.expiryDate}
                onChange={handleChange}
                className={`${inputClass('expiryDate')} text-slate-700`}
              />
              {errors.expiryDate && <p className="text-xs text-red-500 mt-1 pl-1">{errors.expiryDate}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-[#346560] hover:bg-[#2b5450] disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-lg shadow-[#346560]/20"
            >
              {submitting ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;
