import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLayers, FiAlertTriangle, FiPackage, FiTrendingDown, FiEdit2, FiPlusCircle } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import { getMedicines } from '../../services/medicineService';
import { getInventoryItems, getInventoryStats } from '../../services/inventoryService';
import useAuth from '../../hooks/useAuth';

const StockManagement = () => {
  const { user } = useAuth();
  // Pharmacy-scoped admins' stock lives in Inventory, not the legacy Medicine
  // collection - use whichever source actually reflects their account.
  const isPharmacyAdmin = !!user?.pharmacyId;

  const [medicines, setMedicines] = useState([]);
  const [inventory, setInventory] = useState([]);
  // Accurate aggregate counts (not capped by the table's page size) - the
  // same source Dashboard uses, so the two pages never disagree.
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      try {
        if (isPharmacyAdmin) {
          const [itemsRes, statsRes] = await Promise.all([
            getInventoryItems({ limit: 100 }),
            getInventoryStats(),
          ]);
          setInventory(itemsRes.data.data.inventory);
          setStats(statsRes.data.data);
        } else {
          const { data } = await getMedicines({ limit: 100, sortBy: 'quantity', order: 'asc' });
          setMedicines(data.data.medicines);
        }
      } catch (error) {
        toast.error('Failed to load stock levels');
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [isPharmacyAdmin]);

  const rows = isPharmacyAdmin ? inventory : medicines;

  const legacyColumns = [
    { key: 'medicineName', label: 'Medicine' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Current Stock' },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Link
          to={`/medicines/edit/${row._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#346560] hover:text-[#2b5450]"
        >
          <FiEdit2 size={13} /> Adjust
        </Link>
      ),
    },
  ];

  const inventoryColumns = [
    { key: 'medicine', label: 'Medicine', render: (row) => row.medicineId?.name || '—' },
    { key: 'batchNumber', label: 'Batch' },
    { key: 'quantity', label: 'Current Stock' },
    { key: 'sellingPrice', label: 'Price', render: (row) => `₹${row.sellingPrice?.toFixed(2)}` },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management"
        description={
          isPharmacyAdmin
            ? `Monitor stock levels for ${user.pharmacyId.name}.`
            : 'Monitor and adjust medicine stock levels for your store.'
        }
        action={
          isPharmacyAdmin ? (
            <Link
              to="/inventory/add-stock"
              className="flex items-center gap-2 bg-[#4ecdc4] text-[#1c3734] font-semibold text-sm px-5 py-2.5 rounded-2xl hover:bg-[#3dbdb5] transition-colors"
            >
              <FiPlusCircle size={16} /> Add Stock
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={FiPackage}
          label="Total Items"
          value={isPharmacyAdmin ? stats?.totalItems ?? 0 : rows.length}
          bgTint="bg-[#346560]/10"
          iconColor="text-[#346560]"
          borderColor="border-[#346560]/20"
        />
        <StatCard
          icon={FiLayers}
          label="In Stock"
          value={isPharmacyAdmin ? stats?.totalItems - stats?.lowStock - stats?.outOfStock - stats?.expired : rows.filter((m) => m.status === 'In Stock').length}
          bgTint="bg-emerald-500/10"
          iconColor="text-emerald-600"
          borderColor="border-emerald-500/20"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Low Stock"
          value={isPharmacyAdmin ? stats?.lowStock ?? 0 : rows.filter((m) => m.status === 'Low Stock').length}
          bgTint="bg-amber-500/10"
          iconColor="text-amber-600"
          borderColor="border-amber-500/20"
        />
        <StatCard
          icon={FiTrendingDown}
          label="Out of Stock"
          value={isPharmacyAdmin ? stats?.outOfStock ?? 0 : rows.filter((m) => m.status === 'Out of Stock').length}
          bgTint="bg-rose-500/10"
          iconColor="text-rose-600"
          borderColor="border-rose-500/20"
        />
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <DataTable
          columns={isPharmacyAdmin ? inventoryColumns : legacyColumns}
          data={rows}
          emptyTitle={isPharmacyAdmin ? 'No stock yet' : 'No medicines yet'}
          emptyMessage={
            isPharmacyAdmin
              ? 'Use Add Stock to bring medicines from the master catalog into your inventory.'
              : 'Add medicines to your store to start managing stock.'
          }
        />
      )}
    </div>
  );
};

export default StockManagement;
