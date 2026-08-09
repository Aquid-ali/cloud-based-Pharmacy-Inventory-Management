import React from 'react';
import { FiShield, FiUsers, FiLock, FiKey } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { rolesData } from '../../config/mockData';

const columns = [
  { key: 'role', label: 'Role' },
  { key: 'users', label: 'Users' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'description', label: 'Description' },
];

const RolesPermissions = () => (
  <ListPage
    title="Roles & Permissions"
    description="Configure user roles and access permissions across modules."
    stats={[
      { icon: FiShield, label: 'Total Roles', value: rolesData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiUsers, label: 'Assigned Users', value: rolesData.reduce((s, r) => s + r.users, 0), bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiLock, label: 'Modules', value: 8, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      { icon: FiKey, label: 'Permissions', value: 24, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
    columns={columns}
    data={rolesData}
    searchPlaceholder="Search roles..."
    addLabel="Add Role"
  />
);

export default RolesPermissions;
