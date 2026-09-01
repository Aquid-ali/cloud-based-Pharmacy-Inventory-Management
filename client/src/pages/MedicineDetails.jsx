import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiEdit2, FiTrash2, FiPackage, FiCalendar, FiTag, FiDollarSign } from 'react-icons/fi';
import { getMedicineById, deleteMedicine } from '../services/medicineService';
import Spinner from '../components/Spinner';
import ConfirmModal from '../components/ConfirmModal';

const statusBadge = {
  'In Stock': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Low Stock': 'bg-amber-50 text-amber-700 border-amber-200',
  'Out of Stock': 'bg-slate-100 text-slate-700 border-slate-200',
  Expired: 'bg-rose-50 text-rose-700 border-rose-200',
};

const MedicineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const { data } = await getMedicineById(id);
        setMedicine(data.data.medicine);
      } catch (error) {
        toast.error('Failed to load medicine details');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMedicine(id);
      toast.success('Medicine deleted');
      navigate('/medicines');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (!medicine) return <div className="text-center py-12 text-slate-500">Medicine not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <FiArrowLeft size={18} /> Back to medicines
        </button>
        <div className="flex items-center gap-3">
          <Link
            to={`/medicines/edit/${id}`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium hover:bg-amber-100 transition-colors"
          >
            <FiEdit2 size={16} /> Edit
          </Link>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-sm font-medium hover:bg-rose-100 transition-colors"
          >
            <FiTrash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-900">{medicine.medicineName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{medicine.genericName || 'No generic name'}</p>
          </div>
          <span
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border ${
              statusBadge[medicine.status] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {medicine.status}
          </span>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#f0f7f6] border border-[#346560]/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#346560] uppercase mb-1">
              <FiPackage /> Stock Quantity
            </div>
            <p className="text-2xl font-bold text-slate-900">{medicine.quantity}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#f0f7f6] border border-[#346560]/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#346560] uppercase mb-1">
              <FiDollarSign /> Selling Price
            </div>
            <p className="text-2xl font-bold text-slate-900">₹{medicine.sellingPrice?.toFixed(2)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#f0f7f6] border border-[#346560]/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#346560] uppercase mb-1">
              <FiTag /> Category
            </div>
            <p className="text-lg font-bold text-slate-900">{medicine.category}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#f0f7f6] border border-[#346560]/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#346560] uppercase mb-1">
              <FiCalendar /> Expiry Date
            </div>
            <p className="text-lg font-bold text-slate-900">
              {new Date(medicine.expiryDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-sm">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Manufacturer
            </span>
            <p className="font-medium text-slate-800">{medicine.manufacturer}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Batch Number
            </span>
            <p className="font-mono font-medium text-slate-800">{medicine.batchNumber}</p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <ConfirmModal
          title="Delete Medicine"
          message={`Are you sure you want to delete "${medicine.medicineName}"?`}
          confirmText="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};

export default MedicineDetails;
