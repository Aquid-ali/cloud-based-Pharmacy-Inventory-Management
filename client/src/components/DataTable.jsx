import React from 'react';
import EmptyState from './EmptyState';

const DataTable = ({ columns, data, emptyTitle, emptyMessage }) => {
  if (!data?.length) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={row._id || row.id || idx} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 text-slate-700 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
