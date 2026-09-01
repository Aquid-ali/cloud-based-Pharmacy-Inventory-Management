import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMinus, FiPlus, FiShoppingCart, FiArrowLeft, FiMapPin } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import { getMedicineById } from '../../services/medicineService';
import useCart from '../../hooks/useCart';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { SkeletonDetail } from '../../components/Skeleton';
import { stockTint } from '../../utils/stockStatus';

const MedicineDetail = () => {
  const { id } = useParams();
  const { pharmacyId, addItem, selectPharmacy } = useCart();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const fetchMedicine = async () => {
      setLoading(true);
      try {
        const { data } = await getMedicineById(id);
        setMedicine(data.data.medicine);
      } catch (error) {
        toast.error('Medicine not found');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id]);

  if (loading) return <SkeletonDetail />;

  if (!medicine) {
    return (
      <div className="space-y-4">
        <Link to="/shop/search" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-tealPrimary">
          <FiArrowLeft size={14} /> Back to results
        </Link>
        <div className="bg-white rounded-3xl border border-slate-200/80">
          <EmptyState title="Medicine not found" message="This medicine may have been removed or is no longer available." />
        </div>
      </div>
    );
  }

  const outOfStock = medicine.status === 'Out of Stock' || medicine.status === 'Expired';

  const handleAdd = () => {
    if (medicine.store && medicine.store._id !== pharmacyId) {
      const switched = selectPharmacy(medicine.store);
      if (!switched) return;
    }
    addItem(medicine, qty);
  };

  return (
    <div className="space-y-4">
      <Link to="/shop/search" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-tealPrimary">
        <FiArrowLeft size={14} /> Back to results
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="w-full aspect-square rounded-2xl bg-primary-50 flex items-center justify-center text-tealPrimary">
          <TbPill className="w-20 h-20 transform -rotate-45" />
        </div>

        <div className="flex flex-col">
          <span className={`inline-flex self-start items-center px-2.5 py-1 rounded-full text-xs font-semibold border mb-3 ${stockTint[medicine.status]}`}>
            {medicine.status}
          </span>
          <h1 className="text-2xl font-bold font-serif text-ink mb-1">{medicine.medicineName}</h1>
          <p className="text-sm text-ink-soft mb-2">
            {medicine.genericName ? `${medicine.genericName} · ` : ''}{medicine.manufacturer}
          </p>
          {medicine.store?.name && (
            <p className="flex items-center gap-1.5 text-xs text-tealPrimary font-medium mb-4">
              <FiMapPin size={13} className="shrink-0" />
              Sold by {medicine.store.name}
            </p>
          )}

          <p className="text-3xl font-bold text-ink mb-4">₹{medicine.sellingPrice?.toFixed(2)}</p>

          {medicine.description && (
            <p className="text-sm text-ink-soft leading-relaxed mb-6">{medicine.description}</p>
          )}

          <div className="mt-auto flex items-center gap-4">
            <div className="flex items-center border border-slate-200 rounded-2xl">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-3 text-slate-500 hover:text-tealPrimary"
              >
                <FiMinus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(medicine.quantity, q + 1))}
                className="p-3 text-slate-500 hover:text-tealPrimary"
              >
                <FiPlus size={14} />
              </button>
            </div>

            <Button onClick={handleAdd} disabled={outOfStock} icon={FiShoppingCart} size="lg" className="flex-1">
              Add to cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetail;
