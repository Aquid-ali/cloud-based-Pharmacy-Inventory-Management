import React from 'react';
import { FiUsers, FiUserCheck, FiShield, FiUserPlus } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { staffData, Badge } from '../../config/mockData';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'joinDate', label: 'Join Date' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const Staff = () => (
  <ListPage
    title="Staff"
    description="Manage pharmacy staff members and their assignments."
    stats={[
      { icon: FiUsers, label: 'Total Staff', value: staffData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiUserCheck, label: 'Active', value: staffData.filter((s) => s.status === 'Active').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiShield, label: 'Pharmacists', value: staffData.filter((s) => s.role === 'Pharmacist').length, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      { icon: FiUserPlus, label: 'Roles', value: new Set(staffData.map((s) => s.role)).size, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
    columns={columns}
    data={staffData}
    searchPlaceholder="Search staff..."
    addLabel="Add Staff"
  />
);

export default Staff;
