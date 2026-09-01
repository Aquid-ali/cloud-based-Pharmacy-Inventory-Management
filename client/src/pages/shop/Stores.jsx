import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin, FiPhone, FiNavigation, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { getPharmacies, getNearbyPharmacies } from '../../services/pharmacyService';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import useCart from '../../hooks/useCart';

const Stores = () => {
  const navigate = useNavigate();
  const { pharmacyId, selectPharmacy } = useCart();
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const loadAllPharmacies = async () => {
    setLoading(true);
    try {
      const { data } = await getPharmacies({ status: 'active', limit: 100 });
      setPharmacies(data.data.pharmacies);
    } catch (error) {
      toast.error('Failed to load pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await getNearbyPharmacies(latitude, longitude);
          setPharmacies(data.data.pharmacies);
          setLocationDenied(false);
          toast.success('Showing pharmacies near you');
        } catch (error) {
          toast.error('Failed to load nearby pharmacies');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationDenied(true);
        setLocating(false);
        toast.error('Location access denied — showing all pharmacies instead');
      }
    );
  };

  useEffect(() => {
    loadAllPharmacies();
  }, []);

  return (
    <div className="space-y-5">
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-tealPrimary">
        <FiArrowLeft size={14} /> Back to all medicines &amp; pharmacies
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-serif text-ink">Find a nearby pharmacy</h1>
          <p className="text-xs text-ink-soft mt-1">Pick a pharmacy to check its live stock and pricing.</p>
        </div>
        <Button onClick={loadNearby} loading={locating} icon={FiNavigation} className="shrink-0">
          {locating ? 'Locating...' : 'Use my location'}
        </Button>
      </div>

      {locationDenied && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl px-4 py-3">
          We couldn't access your location. Showing all pharmacies — enable location access in your browser to see distances.
        </div>
      )}

      {loading ? (
        <Spinner size="lg" />
      ) : pharmacies.length === 0 ? (
        <EmptyState title="No pharmacies found" message="Check back later for pharmacy availability." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pharmacies.map((pharmacy) => (
            <div key={pharmacy._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-ink text-sm leading-snug">{pharmacy.name}</h3>
                {pharmacy.distanceKm !== undefined && (
                  <span className="shrink-0 text-[11px] font-semibold text-tealPrimary bg-tealPrimary/10 px-2 py-1 rounded-full">
                    {pharmacy.distanceKm} km
                  </span>
                )}
              </div>
              <p className="flex items-start gap-1.5 text-xs text-ink-soft mb-1.5">
                <FiMapPin size={13} className="mt-0.5 shrink-0" />
                {pharmacy.address}, {pharmacy.city}, {pharmacy.state} {pharmacy.pincode}
              </p>
              {pharmacy.phone && (
                <p className="flex items-center gap-1.5 text-xs text-ink-soft mb-3">
                  <FiPhone size={13} className="shrink-0" /> {pharmacy.phone}
                </p>
              )}

              {pharmacyId === pharmacy._id ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <FiCheck size={14} /> Currently shopping here
                </div>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (selectPharmacy(pharmacy)) navigate('/shop');
                  }}
                >
                  Shop from this pharmacy
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stores;
