import React from 'react';
import { FiRefreshCw, FiCheckCircle, FiClock } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { syncStatusData, Badge } from '../../config/mockData';

const columns = [
  { key: 'module', label: 'Module' },
  { key: 'lastSync', label: 'Last Sync' },
  { key: 'records', label: 'Records' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const SyncStatus = () => (
  <ListPage
    title="Sync Status"
    description="Monitor cloud synchronization across all pharmacy modules."
    stats={[
      { icon: FiRefreshCw, label: 'Modules', value: syncStatusData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiCheckCircle, label: 'Synced', value: syncStatusData.filter((s) => s.status === 'Synced').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiClock, label: 'Syncing', value: syncStatusData.filter((s) => s.status === 'Syncing').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
    columns={columns}
    data={syncStatusData}
    searchPlaceholder="Search modules..."
    addLabel="Sync All"
  />
);

export default SyncStatus;
