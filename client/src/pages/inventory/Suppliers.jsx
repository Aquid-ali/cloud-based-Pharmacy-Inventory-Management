import React from 'react';
import { FiTruck, FiCheckCircle, FiClipboard } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { suppliersData, Badge } from '../../config/mockData';

const columns = [
  { key: 'name', label: 'Supplier' },
  { key: 'contact', label: 'Contact Person' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'orders', label: 'Orders' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const Suppliers = () => (
  <ListPage
    title="Suppliers"
    description="Manage supplier contacts and track purchase order history."
    stats={[
      { icon: FiTruck, label: 'Total Suppliers', value: suppliersData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiCheckCircle, label: 'Active', value: suppliersData.filter((s) => s.status === 'Active').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiClipboard, label: 'Total Orders', value: suppliersData.reduce((s, sup) => s + sup.orders, 0), bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
    ]}
    columns={columns}
    data={suppliersData}
    searchPlaceholder="Search suppliers..."
    addLabel="Add Supplier"
  />
);

export default Suppliers;
