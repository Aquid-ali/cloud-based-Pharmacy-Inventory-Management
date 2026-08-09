import React from 'react';
import { FiUsers, FiUserCheck, FiShield } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { usersData, Badge } from '../../config/mockData';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'lastLogin', label: 'Last Login' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const UserManagement = () => (
  <ListPage
    title="User Management"
    description="Manage system users, roles, and access credentials."
    stats={[
      { icon: FiUsers, label: 'Total Users', value: usersData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiUserCheck, label: 'Active', value: usersData.filter((u) => u.status === 'Active').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiShield, label: 'Admins', value: usersData.filter((u) => u.role === 'Admin').length, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
    ]}
    columns={columns}
    data={usersData}
    searchPlaceholder="Search users..."
    addLabel="Add User"
  />
);

export default UserManagement;
