import React from 'react';
import { FiList, FiUser, FiShield } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { auditLogsData } from '../../config/mockData';

const columns = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'user', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'module', label: 'Module' },
  { key: 'ip', label: 'IP Address' },
];

const AuditLogs = () => (
  <ListPage
    title="Audit Logs"
    description="Complete activity trail of all system actions and changes."
    stats={[
      { icon: FiList, label: 'Total Events', value: auditLogsData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiUser, label: 'Active Users', value: 3, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiShield, label: 'Modules Tracked', value: 4, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
    ]}
    columns={columns}
    data={auditLogsData}
    searchPlaceholder="Search audit logs..."
  />
);

export default AuditLogs;
