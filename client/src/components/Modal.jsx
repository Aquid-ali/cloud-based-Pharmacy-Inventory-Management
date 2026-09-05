import React, { useEffect } from 'react';

const MAX_WIDTH_CLASSES = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  '2xl': 'max-w-2xl',
};

/**
 * Shared overlay + panel shell for every modal in the app (see ConfirmModal,
 * MedicineDetailsModal, AddStockModal) - previously copy-pasted identically
 * in each. Closes on Escape or a backdrop click; consumers keep their own
 * header/content/footer markup since those differ structurally per modal.
 */
const Modal = ({ onClose, maxWidth = 'md', className = '', children }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full border border-slate-100 animate-in fade-in zoom-in duration-150 ${
          MAX_WIDTH_CLASSES[maxWidth] || MAX_WIDTH_CLASSES.md
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
