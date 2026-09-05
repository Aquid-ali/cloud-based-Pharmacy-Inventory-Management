import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import Modal from './Modal';

const ConfirmModal = ({ title, message, confirmText = 'Confirm', loading, onConfirm, onCancel }) => {
  return (
    <Modal onClose={onCancel} maxWidth="md" className="p-6 sm:p-7 space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{message}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-60"
        >
          {loading ? 'Deleting...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
