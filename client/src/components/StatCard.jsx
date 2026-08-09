import React from 'react';

const StatCard = ({ icon: Icon, label, value, bgTint, iconColor, borderColor, subtext }) => (
  <div
    className={`bg-white rounded-3xl border ${borderColor || 'border-slate-200/80'} shadow-sm p-6 flex items-center gap-4 transition-all hover:shadow-md`}
  >
    {Icon && (
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bgTint} ${iconColor}`}>
        <Icon size={24} />
      </div>
    )}
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1 font-sans">{value}</p>
      {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

export default StatCard;
