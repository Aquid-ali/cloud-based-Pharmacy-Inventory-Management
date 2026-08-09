import React from 'react';
import { FiFileText, FiClock, FiCheckCircle, FiEdit } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { quotationsData, Badge } from '../../config/mockData';

const columns = [
  { key: 'id', label: 'Quote ID' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'validUntil', label: 'Valid Until' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const Quotations = () => (
  <ListPage
    title="Quotations"
    description="Create and manage price quotations for bulk orders."
    stats={[
      { icon: FiFileText, label: 'Total Quotes', value: quotationsData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiClock, label: 'Pending', value: quotationsData.filter((q) => q.status === 'Pending').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiCheckCircle, label: 'Approved', value: quotationsData.filter((q) => q.status === 'Approved').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiEdit, label: 'Drafts', value: quotationsData.filter((q) => q.status === 'Draft').length, bgTint: 'bg-slate-500/10', iconColor: 'text-slate-600', borderColor: 'border-slate-500/20' },
    ]}
    columns={columns}
    data={quotationsData}
    searchPlaceholder="Search quotations..."
    addLabel="New Quotation"
  />
);

export default Quotations;
