import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin } from 'react-icons/fi';
import { browsePharmacyInventory } from '../../services/pharmacyService';
import PharmacyMedicineCard from '../../components/shop/PharmacyMedicineCard';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { SkeletonCardGrid } from '../../components/Skeleton';
import useCart from '../../hooks/useCart';

const Home = () => {
  const { pharmacyId, pharmacyName, clearPharmacy } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await browsePharmacyInventory({
        pharmacyId: pharmacyId || undefined,
        limit: 24,
      });
      setItems(data.data.inventory);
    } catch (err) {
      setError(true);
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-brandDark rounded-3xl px-6 sm:px-10 py-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Medicines from real pharmacies</h1>
          <p className="text-white/70 text-sm max-w-md">
            {pharmacyId ? (
              <>Shopping from <span className="text-accentCyan font-medium">{pharmacyName}</span>. Search medicines, compare prices, and check stock.</>
            ) : (
              <>Browsing live stock from every MedStock pharmacy. Pick a pharmacy to narrow it down.</>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <Link
            to="/shop/stores"
            className="flex items-center gap-2 bg-accentCyan text-brandDark font-semibold text-sm px-6 py-3 rounded-2xl hover:bg-accentCyanHover transition-colors"
          >
            <FiMapPin size={16} />
            {pharmacyId ? 'Change pharmacy' : 'Choose a pharmacy'}
          </Link>
          {pharmacyId && (
            <button
              onClick={() => clearPharmacy()}
              className="text-white/70 hover:text-white text-xs font-medium underline underline-offset-2"
            >
              Browse all pharmacies instead
            </button>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div>
        <h2 className="text-lg font-bold font-display text-ink mb-3">
          {pharmacyId ? 'Available medicines' : 'Available from MedStock pharmacies'}
        </h2>
        {loading ? (
          <SkeletonCardGrid count={14} />
        ) : error ? (
          <ErrorState
            title="Couldn't load medicines"
            message="Something went wrong while loading available stock."
            onRetry={fetchInventory}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No medicines available"
            message={pharmacyId ? 'Check back soon for available stock at this pharmacy.' : 'Check back soon for available stock.'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {items.map((item) => (
              <PharmacyMedicineCard key={item._id} item={item} showPharmacy={!pharmacyId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
