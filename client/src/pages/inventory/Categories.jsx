import React from 'react';
import { FiTag, FiPackage, FiCheckCircle } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { categoriesData, Badge } from '../../config/mockData';

const columns = [
  { key: 'name', label: 'Category Name' },
  { key: 'medicines', label: 'Medicines' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const Categories = () => (
  <ListPage
    title="Categories"
    description="Organize medicines into categories for easier management."
    stats={[
      { icon: FiTag, label: 'Total Categories', value: categoriesData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiCheckCircle, label: 'Active', value: categoriesData.filter((c) => c.status === 'Active').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiPackage, label: 'Total Medicines', value: categoriesData.reduce((s, c) => s + c.medicines, 0), bgTint: 'bg-blue-500/10', iconColor: 'text-blue-600', borderColor: 'border-blue-500/20' },
    ]}
    columns={columns}
    data={categoriesData}
    searchPlaceholder="Search categories..."
    addLabel="Add Category"
  />
);

export default Categories;
