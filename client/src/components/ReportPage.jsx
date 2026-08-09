import React from 'react';
import PageHeader from './PageHeader';
import StatCard from './StatCard';

const ReportPage = ({ title, description, stats, children }) => (
  <div className="space-y-6">
    <PageHeader title={title} description={description} />

    {stats?.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    )}

    {children}
  </div>
);

export const ChartPlaceholder = ({ title, height = 'h-64' }) => (
  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
    <h3 className="font-serif font-bold text-slate-800 mb-4">{title}</h3>
    <div className={`${height} rounded-2xl bg-gradient-to-br from-[#346560]/5 to-[#4ecdc4]/10 border border-dashed border-[#346560]/20 flex items-center justify-center`}>
      <div className="text-center">
        <div className="flex items-end justify-center gap-1.5 mb-3">
          {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
            <div
              key={i}
              className="w-6 rounded-t-md bg-[#346560]/30"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 font-medium">Chart visualization</p>
      </div>
    </div>
  </div>
);

export default ReportPage;
