import React from 'react';
import { FiSearch, FiPackage, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { availabilityData, Badge } from '../../config/mockData';

const columns = [
  { key: 'medicine', label: 'Medicine' },
  { key: 'category', label: 'Category' },
  { key: 'stock', label: 'Available Stock' },
  { key: 'status', label: 'Availability', render: (row) => <Badge status={row.status} /> },
];

const MedicineAvailability = () => (
  <ListPage
    title="Medicine Availability"
    description="Check real-time stock availability for customer inquiries."
    stats={[
      { icon: FiPackage, label: 'Total Medicines', value: availabilityData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiSearch, label: 'In Stock', value: availabilityData.filter((a) => a.status === 'In Stock').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiAlertTriangle, label: 'Low Stock', value: availabilityData.filter((a) => a.status === 'Low Stock').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
      { icon: FiXCircle, label: 'Out of Stock', value: availabilityData.filter((a) => a.status === 'Out of Stock').length, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
    ]}
    columns={columns}
    data={availabilityData}
    searchPlaceholder="Search medicine availability..."
  />
);

export default MedicineAvailability;
