import React from 'react';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ title = 'No items found', message = 'No data available to display.' }) => {
  return (
    <div className="py-16 text-center flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-[#f0f7f6] text-[#346560] flex items-center justify-center mb-4">
        <FiInbox size={32} />
      </div>
      <h3 className="text-base font-bold text-slate-800 font-serif mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{message}</p>
    </div>
  );
};

export default EmptyState;
