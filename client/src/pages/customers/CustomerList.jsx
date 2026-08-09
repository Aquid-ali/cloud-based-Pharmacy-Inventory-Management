import React from 'react';
import { FiUsers, FiUserPlus, FiHeart, FiShoppingBag } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { customersData, Badge } from '../../config/mockData';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'orders', label: 'Orders' },
  { key: 'loyalty', label: 'Loyalty Tier' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const CustomerList = () => (
  <ListPage
    title="Customer List"
    description="Manage customer profiles, contact details, and purchase history."
    stats={[
      { icon: FiUsers, label: 'Total Customers', value: customersData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiUserPlus, label: 'Active', value: customersData.filter((c) => c.status === 'Active').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiHeart, label: 'Loyalty Members', value: customersData.filter((c) => c.loyalty !== 'Bronze').length, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
      { icon: FiShoppingBag, label: 'Total Orders', value: customersData.reduce((s, c) => s + c.orders, 0), bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
    ]}
    columns={columns}
    data={customersData}
    searchPlaceholder="Search customers..."
    addLabel="Add Customer"
  />
);

export default CustomerList;
