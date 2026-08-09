import React from 'react';
import { FiClock, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { expiryAlerts, Badge } from '../../config/mockData';

const columns = [
  { key: 'medicine', label: 'Medicine' },
  { key: 'batch', label: 'Batch' },
  { key: 'expiry', label: 'Expiry Date' },
  { key: 'qty', label: 'Quantity' },
  { key: 'severity', label: 'Severity', render: (row) => <Badge status={row.severity} /> },
];

const ExpiryAlerts = () => (
  <ListPage
    title="Expiry Alerts"
    description="Medicines approaching or past their expiry dates."
    stats={[
      { icon: FiClock, label: 'Total Alerts', value: expiryAlerts.length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiXCircle, label: 'Critical', value: expiryAlerts.filter((a) => a.severity === 'Critical').length, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
      { icon: FiAlertTriangle, label: 'Warning', value: expiryAlerts.filter((a) => a.severity === 'Warning').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
    columns={columns}
    data={expiryAlerts}
    searchPlaceholder="Search expiry alerts..."
  />
);

export default ExpiryAlerts;
