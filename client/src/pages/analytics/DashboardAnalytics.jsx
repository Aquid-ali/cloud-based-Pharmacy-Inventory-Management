import React from 'react';
import { FiGrid, FiTrendingUp, FiDollarSign, FiUsers } from 'react-icons/fi';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import StatCard from '../../components/StatCard';

const DashboardAnalytics = () => (
  <ReportPage
    title="Dashboard Analytics"
    description="Comprehensive analytics overview for your pharmacy operations."
    stats={[
      { icon: FiDollarSign, label: 'Monthly Revenue', value: '₹4.8L', bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiTrendingUp, label: 'Growth Rate', value: '+18%', bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiUsers, label: 'New Customers', value: 23, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      { icon: FiGrid, label: 'Active SKUs', value: 156, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartPlaceholder title="Revenue Overview" height="h-72" />
      <ChartPlaceholder title="Customer Acquisition" height="h-72" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <StatCard label="Conversion Rate" value="68%" bgTint="bg-purple-500/10" iconColor="text-purple-600" borderColor="border-purple-500/20" subtext="Walk-in to purchase" />
      <StatCard label="Repeat Customers" value="42%" bgTint="bg-teal-500/10" iconColor="text-teal-600" borderColor="border-teal-500/20" subtext="Last 30 days" />
      <StatCard label="Avg. Basket Size" value="₹1,410" bgTint="bg-indigo-500/10" iconColor="text-indigo-600" borderColor="border-indigo-500/20" subtext="Per transaction" />
    </div>
  </ReportPage>
);

export default DashboardAnalytics;
