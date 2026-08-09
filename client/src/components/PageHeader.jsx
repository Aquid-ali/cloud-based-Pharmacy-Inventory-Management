import React from 'react';

const PageHeader = ({ title, description, action }) => (
  <div className="bg-[#1c3734] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#4ecdc4]/10 rounded-full blur-3xl pointer-events-none" />
    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-[#4ecdc4] text-sm font-medium">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </div>
);

export default PageHeader;
