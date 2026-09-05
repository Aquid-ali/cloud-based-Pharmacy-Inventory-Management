import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Shared prev/next pager for server-paginated lists (page/totalPages/onChange
 * shape) - extracted from MedicineList.jsx, which hand-rolled this before.
 * Not for client-side-sliced lists with a different pagination shape.
 */
const Pagination = ({ page, totalPages, onPageChange, total, itemLabel = 'items' }) => (
  <div className="py-4 px-6 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
    <span className="text-xs text-slate-500">
      Page {page} of {totalPages}
      {typeof total === 'number' ? ` · ${total} ${itemLabel}` : ''}
    </span>
    <div className="flex items-center gap-2">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
        aria-label="Previous page"
      >
        <FiChevronLeft size={16} />
      </button>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
        aria-label="Next page"
      >
        <FiChevronRight size={16} />
      </button>
    </div>
  </div>
);

export default Pagination;
