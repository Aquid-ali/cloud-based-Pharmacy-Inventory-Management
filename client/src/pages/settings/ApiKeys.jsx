import React from 'react';
import { FiKey, FiPlus, FiCopy } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { apiKeysData, Badge } from '../../config/mockData';
import toast from 'react-hot-toast';

const columns = [
  { key: 'name', label: 'Key Name' },
  {
    key: 'key',
    label: 'API Key',
    render: (row) => (
      <div className="flex items-center gap-2">
        <code className="text-xs bg-slate-100 px-2 py-1 rounded-lg font-mono">{row.key}</code>
        <button
          onClick={() => toast.success('API key copied')}
          className="text-slate-400 hover:text-[#346560]"
        >
          <FiCopy size={14} />
        </button>
      </div>
    ),
  },
  { key: 'created', label: 'Created' },
  { key: 'lastUsed', label: 'Last Used' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const ApiKeys = () => (
  <ListPage
    title="API Keys"
    description="Manage API keys for third-party integrations and mobile apps."
    stats={[
      { icon: FiKey, label: 'Total Keys', value: apiKeysData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiPlus, label: 'Active', value: apiKeysData.filter((k) => k.status === 'Active').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
    ]}
    columns={columns}
    data={apiKeysData}
    searchPlaceholder="Search API keys..."
    addLabel="Generate Key"
  />
);

export default ApiKeys;
