import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiAlertTriangle, FiXCircle, FiSlash, FiGrid, FiPlusCircle } from 'react-icons/fi';
import { getDashboardStats } from '../services/medicineService';
import { getInventoryStats } from '../services/inventoryService';
import Spinner from '../components/Spinner';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, bgTint, iconColor, borderColor }) => (
  <div className={`bg-white rounded-3xl border ${borderColor} shadow-sm p-6 flex items-center gap-4 transition-all hover:shadow-md`}>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bgTint} ${iconColor}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1 font-sans">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  // Pharmacy-scoped admins' data lives in Inventory, not the legacy Medicine
  // collection - use whichever stats endpoint actually reflects their account.
  const isPharmacyAdmin = !!user?.pharmacyId;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = isPharmacyAdmin ? await getInventoryStats() : await getDashboardStats();
        setStats(data.data);
      } catch (error) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isPharmacyAdmin]);

  if (loading) return <Spinner size="lg" />;

  const pharmacyName = user?.pharmacyId?.name;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1c3734] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#4ecdc4]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              {pharmacyName ? `${pharmacyName} Overview` : 'Pharmacy Overview'}
            </h1>
            <p className="text-[#4ecdc4] text-sm font-medium">
              Live statistics for your medicine inventory and stock health.
            </p>
          </div>
          {isPharmacyAdmin && (
            <Link
              to="/inventory/add-stock"
              className="shrink-0 flex items-center gap-2 bg-[#4ecdc4] text-[#1c3734] font-semibold text-sm px-5 py-2.5 rounded-2xl hover:bg-[#3dbdb5] transition-colors"
            >
              <FiPlusCircle size={16} /> Add Stock
            </Link>
          )}
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={FiPackage}
          label="Total Medicines"
          value={(isPharmacyAdmin ? stats?.totalItems : stats?.totalMedicines) ?? 0}
          bgTint="bg-[#346560]/10"
          iconColor="text-[#346560]"
          borderColor="border-[#346560]/20"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Low Stock"
          value={stats?.lowStock ?? 0}
          bgTint="bg-amber-500/10"
          iconColor="text-amber-600"
          borderColor="border-amber-500/20"
        />
        <StatCard
          icon={FiXCircle}
          label="Expired Medicines"
          value={stats?.expired ?? 0}
          bgTint="bg-rose-500/10"
          iconColor="text-rose-600"
          borderColor="border-rose-500/20"
        />
        {isPharmacyAdmin ? (
          <StatCard
            icon={FiSlash}
            label="Out of Stock"
            value={stats?.outOfStock ?? 0}
            bgTint="bg-slate-500/10"
            iconColor="text-slate-600"
            borderColor="border-slate-500/20"
          />
        ) : (
          <StatCard
            icon={FiGrid}
            label="Categories"
            value={stats?.totalCategories ?? 0}
            bgTint="bg-emerald-500/10"
            iconColor="text-emerald-600"
            borderColor="border-emerald-500/20"
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
