import React from 'react';
import { FiClipboard, FiClock, FiCheckCircle, FiTruck } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { purchaseOrdersData, Badge } from '../../config/mockData';

const columns = [
  { key: 'id', label: 'PO Number' },
  { key: 'date', label: 'Date' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'expected', label: 'Expected' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const PurchaseOrders = () => (
  <ListPage
    title="Purchase Orders"
    description="Create and track purchase orders from suppliers."
    stats={[
      { icon: FiClipboard, label: 'Total Orders', value: purchaseOrdersData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiClock, label: 'Pending', value: purchaseOrdersData.filter((p) => p.status === 'Pending').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiCheckCircle, label: 'Approved', value: purchaseOrdersData.filter((p) => p.status === 'Approved').length, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      { icon: FiTruck, label: 'Completed', value: purchaseOrdersData.filter((p) => p.status === 'Completed').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
    ]}
    columns={columns}
    data={purchaseOrdersData}
    searchPlaceholder="Search purchase orders..."
    addLabel="New Order"
  />
);

export default PurchaseOrders;
