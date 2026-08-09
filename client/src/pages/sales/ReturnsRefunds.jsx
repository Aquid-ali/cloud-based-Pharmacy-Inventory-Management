import React from 'react';
import { FiRotateCcw, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { returnsData, Badge } from '../../config/mockData';

const columns = [
  { key: 'id', label: 'Return ID' },
  { key: 'date', label: 'Date' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'customer', label: 'Customer' },
  { key: 'reason', label: 'Reason' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const ReturnsRefunds = () => (
  <ListPage
    title="Returns & Refunds"
    description="Process and track product returns and refund requests."
    stats={[
      { icon: FiRotateCcw, label: 'Total Returns', value: returnsData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiClock, label: 'Pending', value: returnsData.filter((r) => r.status === 'Pending').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiCheckCircle, label: 'Completed', value: returnsData.filter((r) => r.status === 'Completed').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiAlertCircle, label: 'Refund Amount', value: '₹555', bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
    ]}
    columns={columns}
    data={returnsData}
    searchPlaceholder="Search returns..."
    addLabel="New Return"
  />
);

export default ReturnsRefunds;
