import React from 'react';

const statusStyles = {
  Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border border-slate-200',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
  'In Stock': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Low Stock': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Out of Stock': 'bg-slate-100 text-slate-700 border border-slate-200',
  Expired: 'bg-rose-50 text-rose-700 border border-rose-200',
  Critical: 'bg-rose-50 text-rose-700 border border-rose-200',
  Warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  Paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Unpaid: 'bg-rose-50 text-rose-700 border border-rose-200',
  Draft: 'bg-slate-100 text-slate-600 border border-slate-200',
  Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Present: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Absent: 'bg-rose-50 text-rose-700 border border-rose-200',
  Late: 'bg-amber-50 text-amber-700 border border-amber-200',
  Synced: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Syncing: 'bg-amber-50 text-amber-700 border border-amber-200',
  Failed: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const Badge = ({ status }) => (
  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${statusStyles[status] || statusStyles.Inactive}`}>
    {status}
  </span>
);

export default Badge;
