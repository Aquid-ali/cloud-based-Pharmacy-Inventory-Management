import React from 'react';
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiClock } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { salesHistoryData, Badge } from '../../config/mockData';

const columns = [
  { key: 'id', label: 'Invoice' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'payment', label: 'Payment' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const SalesHistory = () => (
  <ListPage
    title="Sales History"
    description="View and search all completed sales transactions."
    stats={[
      { icon: FiDollarSign, label: 'Today\'s Sales', value: '₹5,135', bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiShoppingBag, label: 'Transactions', value: salesHistoryData.length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiTrendingUp, label: 'This Month', value: '₹4.8L', bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      { icon: FiClock, label: 'Avg. Order', value: '₹1,410', bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
    columns={columns}
    data={salesHistoryData}
    searchPlaceholder="Search invoices..."
  />
);

export default SalesHistory;
