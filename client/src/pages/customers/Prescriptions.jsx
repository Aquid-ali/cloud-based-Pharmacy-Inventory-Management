import React from 'react';
import { FiFileText, FiClock, FiCheckCircle, FiUser } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { prescriptionsData, Badge } from '../../config/mockData';

const columns = [
  { key: 'id', label: 'Prescription ID' },
  { key: 'date', label: 'Date' },
  { key: 'patient', label: 'Patient' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'medicines', label: 'Medicines' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const Prescriptions = () => (
  <ListPage
    title="Prescriptions"
    description="Manage and fulfill customer prescription orders."
    stats={[
      { icon: FiFileText, label: 'Total Prescriptions', value: prescriptionsData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiClock, label: 'Pending', value: prescriptionsData.filter((p) => p.status === 'Pending').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiCheckCircle, label: 'Completed', value: prescriptionsData.filter((p) => p.status === 'Completed').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiUser, label: 'Today', value: 2, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
    ]}
    columns={columns}
    data={prescriptionsData}
    searchPlaceholder="Search prescriptions..."
    addLabel="New Prescription"
  />
);

export default Prescriptions;
