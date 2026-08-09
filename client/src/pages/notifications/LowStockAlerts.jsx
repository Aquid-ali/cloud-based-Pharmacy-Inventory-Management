import React from 'react';
import { FiAlertTriangle, FiXCircle, FiPackage } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { lowStockAlerts, Badge } from '../../config/mockData';

const columns = [
  { key: 'medicine', label: 'Medicine' },
  { key: 'current', label: 'Current Stock' },
  { key: 'min', label: 'Minimum Level' },
  { key: 'severity', label: 'Severity', render: (row) => <Badge status={row.severity} /> },
];

const LowStockAlerts = () => (
  <ListPage
    title="Low Stock Alerts"
    description="Medicines that have fallen below minimum stock levels."
    stats={[
      { icon: FiAlertTriangle, label: 'Total Alerts', value: lowStockAlerts.length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiXCircle, label: 'Critical', value: lowStockAlerts.filter((a) => a.severity === 'Critical').length, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
      { icon: FiPackage, label: 'Warning', value: lowStockAlerts.filter((a) => a.severity === 'Warning').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
    columns={columns}
    data={lowStockAlerts}
    searchPlaceholder="Search alerts..."
    addLabel="Create PO"
  />
);

export default LowStockAlerts;
