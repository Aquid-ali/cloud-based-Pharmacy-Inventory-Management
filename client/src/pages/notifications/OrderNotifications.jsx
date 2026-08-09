import React from 'react';
import { FiBell, FiClock, FiCheckCircle } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { orderNotifications, Badge } from '../../config/mockData';

const columns = [
  { key: 'title', label: 'Notification' },
  { key: 'type', label: 'Type' },
  { key: 'time', label: 'Time' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const OrderNotifications = () => (
  <ListPage
    title="Order Notifications"
    description="Purchase orders, sales requests, and delivery updates."
    stats={[
      { icon: FiBell, label: 'Total', value: orderNotifications.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiClock, label: 'Pending', value: orderNotifications.filter((n) => n.status === 'Pending').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiCheckCircle, label: 'Completed', value: orderNotifications.filter((n) => n.status === 'Completed').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
    ]}
    columns={columns}
    data={orderNotifications}
    searchPlaceholder="Search notifications..."
  />
);

export default OrderNotifications;
