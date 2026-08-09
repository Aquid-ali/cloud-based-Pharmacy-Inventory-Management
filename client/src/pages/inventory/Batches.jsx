import React from 'react';
import { FiBox, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { batchesData, Badge } from '../../config/mockData';

const columns = [
  { key: 'batch', label: 'Batch No.' },
  { key: 'medicine', label: 'Medicine' },
  { key: 'qty', label: 'Quantity' },
  { key: 'mfg', label: 'Mfg Date' },
  { key: 'expiry', label: 'Expiry Date' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const Batches = () => (
  <ListPage
    title="Batches"
    description="Track batch numbers, manufacturing dates, and expiry information."
    stats={[
      { icon: FiBox, label: 'Total Batches', value: batchesData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiAlertTriangle, label: 'Low Stock', value: batchesData.filter((b) => b.status === 'Low Stock').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiXCircle, label: 'Expired', value: batchesData.filter((b) => b.status === 'Expired').length, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
    ]}
    columns={columns}
    data={batchesData}
    searchPlaceholder="Search batches..."
    addLabel="Add Batch"
  />
);

export default Batches;
