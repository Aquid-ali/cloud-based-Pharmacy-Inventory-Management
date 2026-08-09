import React from 'react';
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import DataTable from '../../components/DataTable';
import { reportSummary, salesHistoryData } from '../../config/mockData';

const SalesReport = () => (
  <ReportPage
    title="Sales Report"
    description="Analyze sales performance, revenue trends, and transaction data."
    stats={[
      { icon: FiDollarSign, label: 'Total Revenue', value: reportSummary.sales.total, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiShoppingBag, label: 'Total Orders', value: reportSummary.sales.orders, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiBarChart2, label: 'Avg. Order Value', value: reportSummary.sales.avgOrder, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      { icon: FiTrendingUp, label: 'Growth', value: reportSummary.sales.growth, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartPlaceholder title="Monthly Revenue Trend" />
      <ChartPlaceholder title="Sales by Payment Method" />
    </div>
    <DataTable
      columns={[
        { key: 'id', label: 'Invoice' },
        { key: 'date', label: 'Date' },
        { key: 'customer', label: 'Customer' },
        { key: 'total', label: 'Amount' },
        { key: 'payment', label: 'Payment' },
      ]}
      data={salesHistoryData}
    />
  </ReportPage>
);

export default SalesReport;
