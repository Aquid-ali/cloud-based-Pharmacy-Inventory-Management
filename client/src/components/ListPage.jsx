import React, { useState } from 'react';
import { FiSearch, FiPlus, FiFilter } from 'react-icons/fi';
import PageHeader from './PageHeader';
import StatCard from './StatCard';
import DataTable from './DataTable';

const ListPage = ({
  title,
  description,
  stats,
  columns,
  data,
  searchPlaceholder = 'Search...',
  addLabel,
  onAdd,
  filters,
  emptyTitle = 'No items found',
  emptyMessage = 'No data available to display.',
}) => {
  const [search, setSearch] = useState('');

  const filtered = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={
          addLabel && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4ecdc4] text-[#1c3734] rounded-2xl text-sm font-semibold hover:bg-[#3dbdb5] transition-colors"
            >
              <FiPlus size={16} />
              {addLabel}
            </button>
          )
        }
      />

      {stats?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]"
            />
          </div>
          {filters}
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <FiFilter size={16} />
            Filters
          </button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
        />
      </div>
    </div>
  );
};

export default ListPage;
