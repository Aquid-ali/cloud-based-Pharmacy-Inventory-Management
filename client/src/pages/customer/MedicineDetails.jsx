import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiMapPin,
  FiAlertTriangle,
  FiInfo,
  FiShoppingCart,
  FiZap,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import {
  getCatalogMedicineById,
  getCatalogMedicineAvailability,
  searchCatalogMedicines,
} from '../../services/medicineCatalogService';
import Spinner from '../../components/Spinner';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import Tabs from '../../components/Tabs';
import MedicineCatalogCard from '../../components/customer/MedicineCatalogCard';
import { SkeletonDetail } from '../../components/Skeleton';
import { stockTint } from '../../utils/stockStatus';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';

const REVIEW_ROWS = [
  { label: 'Excellent', key: 'excellent', color: 'bg-emerald-500' },
  { label: 'Average', key: 'average', color: 'bg-amber-500' },
  { label: 'Poor', key: 'poor', color: 'bg-rose-500' },
];

const NOT_AVAILABLE = 'Not available';

// Renders a labeled field, showing "Not available" (rather than hiding the
// field) when the medicine record doesn't have verified data for it - so a
// gap in the source data is always visible, never silently absent.
const InfoField = ({ label, value }) => (
  <div>
    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1">{label}</h3>
    <p className={`text-sm leading-relaxed ${value ? 'text-ink-soft' : 'text-ink-faint italic'}`}>
      {value || NOT_AVAILABLE}
    </p>
  </div>
);

const prescriptionLabel = (value) => {
  if (value === true) return { text: 'Prescription required', tint: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (value === false) return { text: 'Over-the-counter (no prescription required)', tint: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return { text: 'Prescription requirement not specified', tint: 'bg-slate-100 text-slate-600 border-slate-200' };
};

const MedicineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pharmacyId, addItem, selectPharmacy } = useCart();
  const { user } = useAuth();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const [pharmacies, setPharmacies] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState('');

  const [related, setRelated] = useState([]);

  useEffect(() => {
    let active = true;
    setImgError(false);

    const fetchMedicine = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getCatalogMedicineById(id);
        if (active) setMedicine(data.data.medicine);
      } catch (err) {
        if (!active) return;
        setError(err.response?.status === 404 ? 'Medicine not found.' : 'Failed to load medicine details.');
      } finally {
        if (active) setLoading(false);
      }
    };

    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError('');
      try {
        const { data } = await getCatalogMedicineAvailability(id);
        if (active) setPharmacies(data.data.pharmacies);
      } catch (err) {
        if (active) setAvailabilityError('Failed to load pharmacy availability.');
      } finally {
        if (active) setAvailabilityLoading(false);
      }
    };

    fetchMedicine();
    fetchAvailability();
    return () => {
      active = false;
    };
  }, [id]);

  // Related medicines: a lightweight heuristic (same manufacturer) rather
  // than a real recommendation engine - the catalog has no category/tag
  // field to group by (see landingContent.js's own note on this), so
  // manufacturer is the closest real signal already on the record.
  useEffect(() => {
    if (!medicine?.manufacturer) {
      setRelated([]);
      return undefined;
    }
    let active = true;
    searchCatalogMedicines({ q: medicine.manufacturer, limit: 7 })
      .then(({ data }) => {
        if (!active) return;
        setRelated(data.data.medicines.filter((m) => m._id !== medicine._id).slice(0, 6));
      })
      .catch(() => {
        if (active) setRelated([]);
      });
    return () => {
      active = false;
    };
  }, [medicine?.manufacturer, medicine?._id]);

  if (loading) return <SkeletonDetail />;

  if (error || !medicine) {
    return (
      <div className="space-y-4">
        <Link
          to="/customer/medicines"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-tealPrimary"
        >
          <FiArrowLeft size={14} /> Back to search
        </Link>
        <div className="bg-white rounded-3xl border border-slate-200/80">
          <EmptyState title={error || 'Medicine not found'} message="It may have been removed from the catalog." />
        </div>
      </div>
    );
  }

  const showImage = medicine.imageUrl && !imgError;
  const reviewStats = medicine.reviewStats || {};
  const hasReviewStats = REVIEW_ROWS.some(({ key }) => (reviewStats[key] || 0) > 0);
  const isVerified = medicine.enrichmentStatus === 'completed';

  const strengthAndForm = [medicine.strength, medicine.dosageForm].filter(Boolean).join(' · ') || null;
  const prescription = prescriptionLabel(medicine.prescriptionRequired);

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-4">
          <InfoField label="Generic Name" value={medicine.genericName} />
          <InfoField label="Composition / Active Ingredients" value={medicine.composition} />
          <InfoField label="Strength & Dosage Form" value={strengthAndForm} />
        </div>
      ),
    },
    {
      id: 'uses',
      label: 'Uses & Effects',
      content: (
        <div className="space-y-4">
          <InfoField label="What It's Used For" value={medicine.uses} />
          <InfoField label="How It Works" value={medicine.howItWorks} />
          <InfoField label="Common Side Effects" value={medicine.sideEffects} />
        </div>
      ),
    },
    {
      id: 'safety',
      label: 'Safety',
      content: (
        <div className="space-y-4">
          <InfoField label="Precautions" value={medicine.precautions} />
          <InfoField label="Contraindications" value={medicine.contraindications} />
          <InfoField label="Storage Information" value={medicine.storage} />
        </div>
      ),
    },
    {
      id: 'reviews',
      label: 'Reviews',
      content: hasReviewStats ? (
        <div className="space-y-1.5 max-w-sm">
          {REVIEW_ROWS.map(({ label, key, color }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-ink-soft w-16 shrink-0">{label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${reviewStats[key] || 0}%` }} />
              </div>
              <span className="text-xs text-ink-soft w-9 text-right">{reviewStats[key] || 0}%</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-faint italic">No reviews yet for this medicine.</p>
      ),
    },
  ];

  // Adds 1 unit from the given pharmacy row to the cart, switching the cart's
  // selected pharmacy first if it's currently empty or set to a different one
  // (mirrors the same pattern used on the /shop pages).
  const addRowToCart = (row) => {
    if (pharmacyId !== row.pharmacyId) {
      const switched = selectPharmacy({ _id: row.pharmacyId, name: row.pharmacyName });
      if (!switched) return false;
    }
    addItem({
      _id: medicine._id,
      medicineName: medicine.name,
      sellingPrice: row.sellingPrice,
      manufacturer: medicine.manufacturer,
      quantity: row.quantity,
    });
    return true;
  };

  const handleAddToCart = (row) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    addRowToCart(row);
  };

  const handleBuyNow = (row) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    if (addRowToCart(row)) {
      navigate('/shop/checkout');
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/customer/medicines"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-tealPrimary"
      >
        <FiArrowLeft size={14} /> Back to search
      </Link>

      {/* Medicine info (left, wider) and pharmacy availability (right) sit
          side by side from lg upward - stacked on smaller screens. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ===================== MEDICINE INFORMATION ===================== */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-tealPrimary">Medicine Information</h2>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
              title="Whether the clinical details below (composition, uses, side effects, etc.) have been matched against a verified reference source"
            >
              {isVerified ? <FiCheckCircle size={12} /> : <FiClock size={12} />}
              {isVerified ? 'Verified information' : 'Information pending verification'}
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
              <div className="w-full aspect-square rounded-2xl bg-primary-50 flex items-center justify-center text-tealPrimary overflow-hidden">
                {showImage ? (
                  <img
                    src={medicine.imageUrl}
                    alt={medicine.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <TbPill className="w-20 h-20 transform -rotate-45" />
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-ink mb-1">{medicine.name}</h1>
                  <p className="text-sm text-ink-soft">{medicine.manufacturer}</p>
                </div>

                <span className={`inline-flex self-start items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${prescription.tint}`}>
                  {prescription.text}
                </span>
              </div>
            </div>

            <Tabs tabs={tabs} />
          </div>
        </div>

        {/* ===================== PHARMACY AVAILABILITY ===================== */}
        <div className="lg:sticky lg:top-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-tealPrimary mb-3">Pharmacy Availability</h2>
          {availabilityLoading ? (
            <Spinner size="md" />
          ) : availabilityError ? (
            <p className="text-xs text-rose-600">{availabilityError}</p>
          ) : pharmacies.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center">
              <p className="text-sm text-ink-soft">No pharmacies currently have this medicine in stock.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto pr-0.5">
              {pharmacies.map((p, idx) => (
                <div
                  key={`${p.pharmacyName}-${idx}`}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4"
                >
                  <p className="text-sm font-semibold text-ink">{p.pharmacyName}</p>
                  <p className="flex items-start gap-1 text-xs text-ink-soft mt-0.5">
                    <FiMapPin size={12} className="shrink-0 mt-0.5" />
                    <span>
                      {p.address}, {p.city}, {p.state}
                    </span>
                  </p>

                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        stockTint[p.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.expiringSoon && (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-amber-600"
                        title="This batch is nearing its expiry date"
                      >
                        <FiAlertTriangle size={12} /> Expiring soon
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-ink-soft">{p.quantity} in stock</span>
                    <span className="text-base font-bold text-ink">₹{p.sellingPrice?.toFixed(2)}</span>
                  </div>

                  {p.status !== 'Out of Stock' && (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleAddToCart(p)}
                        title="Add to cart"
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-tealPrimary border border-tealPrimary/30 hover:bg-tealPrimary/5 px-3 py-2 rounded-xl transition-colors"
                      >
                        <FiShoppingCart size={13} /> Add
                      </button>
                      <button
                        onClick={() => handleBuyNow(p)}
                        title="Buy now"
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-tealPrimary hover:bg-tealHover px-3 py-2 rounded-xl transition-colors"
                      >
                        <FiZap size={13} /> Buy Now
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-tealPrimary mb-3">
            More from {medicine.manufacturer}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {related.map((m) => (
              <MedicineCatalogCard key={m._id} medicine={m} />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <FiInfo className="text-amber-600 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-amber-800 leading-relaxed">
          This information is provided for reference only and is not medical advice. Always consult a qualified
          doctor or pharmacist before taking any medicine.
        </p>
      </div>

      {showAuthPrompt && (
        <ConfirmModal
          title="Sign in to continue"
          message="Create a free account or sign in to add this medicine to your cart."
          confirmText="Sign in"
          onCancel={() => setShowAuthPrompt(false)}
          onConfirm={() =>
            navigate('/login', { state: { from: { pathname: `/customer/medicines/${id}` } } })
          }
        />
      )}
    </div>
  );
};

export default MedicineDetails;
