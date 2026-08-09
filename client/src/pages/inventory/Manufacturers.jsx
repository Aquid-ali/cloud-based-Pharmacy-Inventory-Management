import React from 'react';
import { FiActivity, FiGlobe, FiPackage } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { manufacturersData, Badge } from '../../config/mockData';

const columns = [
  { key: 'name', label: 'Manufacturer' },
  { key: 'country', label: 'Country' },
  { key: 'products', label: 'Products' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const Manufacturers = () => (
  <ListPage
    title="Manufacturers"
    description="Manage medicine manufacturers and their product catalogs."
    stats={[
      { icon: FiActivity, label: 'Manufacturers', value: manufacturersData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiGlobe, label: 'Countries', value: new Set(manufacturersData.map((m) => m.country)).size, bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
      { icon: FiPackage, label: 'Total Products', value: manufacturersData.reduce((s, m) => s + m.products, 0), bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
    ]}
    columns={columns}
    data={manufacturersData}
    searchPlaceholder="Search manufacturers..."
    addLabel="Add Manufacturer"
  />
);

export default Manufacturers;
