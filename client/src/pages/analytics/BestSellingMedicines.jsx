import React from 'react';
import { FiTrendingUp, FiDollarSign, FiAward } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import DataTable from '../../components/DataTable';
import { bestSellingData } from '../../config/mockData';

const BestSellingMedicines = () => (
  <ReportPage
    title="Best Selling Medicines"
    description="Top performing medicines ranked by sales volume and revenue."
    stats={[
      { icon: TbPill, label: 'Top Seller', value: 'Paracetamol', bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiTrendingUp, label: 'Total Units Sold', value: '4,086', bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiDollarSign, label: 'Top Revenue', value: '₹62,000', bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      { icon: FiAward, label: 'Fastest Growing', value: 'Cetirizine', bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
  >
    <ChartPlaceholder title="Top 10 Best Sellers" height="h-72" />
    <DataTable
      columns={[
        { key: 'medicine', label: 'Medicine' },
        { key: 'sold', label: 'Units Sold' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'trend', label: 'Trend', render: (row) => (
          <span className={row.trend.startsWith('+') ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
            {row.trend}
          </span>
        )},
      ]}
      data={bestSellingData}
    />
  </ReportPage>
);

export default BestSellingMedicines;
