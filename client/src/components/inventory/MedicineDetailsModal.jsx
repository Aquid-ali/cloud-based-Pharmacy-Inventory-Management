import React, { useEffect, useState } from 'react';
import { FiX, FiPlus, FiZap, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import toast from 'react-hot-toast';
import { getCatalogMedicineById } from '../../services/medicineCatalogService';
import { enrichMedicine } from '../../services/medicineEnrichmentService';
import Spinner from '../Spinner';

const REVIEW_ROWS = [
  { label: 'Excellent', key: 'excellent', color: 'bg-emerald-500' },
  { label: 'Average', key: 'average', color: 'bg-amber-500' },
  { label: 'Poor', key: 'poor', color: 'bg-rose-500' },
];

// Full catalog detail for one medicine, fetched fresh on open - lets an admin
// review composition/uses/side effects/reviews before deciding to stock it,
// without leaving the Add Stock search flow.
const MedicineDetailsModal = ({ medicineId, onClose, onAddToInventory }) => {
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getCatalogMedicineById(medicineId)
      .then(({ data }) => {
        if (active) setMedicine(data.data.medicine);
      })
      .catch(() => {
        if (active) setError('Failed to load medicine details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [medicineId]);

  const showImage = medicine?.imageUrl && !imgError;
  const reviewStats = medicine?.reviewStats || {};
  const hasReviewStats = REVIEW_ROWS.some(({ key }) => (reviewStats[key] || 0) > 0);
  const isCompleted = medicine?.enrichmentStatus === 'completed';

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const { data } = await enrichMedicine(medicine._id, isCompleted);
      toast.success(data.message);
      setMedicine(data.data.medicine);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enrich medicine');
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between p-6 sm:p-7 pb-0">
          <h3 className="text-base font-bold text-slate-900 font-serif">Medicine details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 -mr-1">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-7">
          {loading ? (
            <Spinner size="lg" />
          ) : error || !medicine ? (
            <p className="text-sm text-rose-600 py-8 text-center">{error || 'Medicine not found.'}</p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="w-full aspect-square rounded-2xl bg-[#f0f7f6] flex items-center justify-center text-[#346560] overflow-hidden">
                  {showImage ? (
                    <img
                      src={medicine.imageUrl}
                      alt={medicine.name}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <TbPill className="w-16 h-16 transform -rotate-45" />
                  )}
                </div>

                <div className="flex flex-col">
                  <h2 className="text-xl font-bold font-serif text-slate-900 mb-1">{medicine.name}</h2>
                  <p className="text-sm text-slate-500 mb-4">{medicine.manufacturer}</p>

                  <div className="mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Composition</h4>
                    <p className="text-sm text-slate-700">{medicine.composition}</p>
                  </div>

                  {medicine.uses && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Uses</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{medicine.uses}</p>
                    </div>
                  )}

                  {medicine.sideEffects && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Side Effects</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{medicine.sideEffects}</p>
                    </div>
                  )}
                </div>
              </div>

              {hasReviewStats && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Review Statistics</h4>
                  <div className="space-y-1.5 max-w-sm">
                    {REVIEW_ROWS.map(({ label, key, color }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-16 shrink-0">{label}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${color}`} style={{ width: `${reviewStats[key] || 0}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-9 text-right">{reviewStats[key] || 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                {isCompleted ? (
                  <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                    <FiCheckCircle size={14} /> Medicine information already enriched.
                    <button onClick={handleEnrich} disabled={enriching} className="ml-1 font-semibold underline disabled:opacity-50">
                      {enriching ? 'Refreshing…' : 'Refresh Information'}
                    </button>
                  </p>
                ) : (
                  <button
                    onClick={handleEnrich}
                    disabled={enriching}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#346560] border border-[#346560]/30 hover:bg-[#346560]/5 px-4 py-2.5 rounded-2xl transition-colors disabled:opacity-50"
                  >
                    {enriching ? <FiRefreshCw className="animate-spin" size={14} /> : <FiZap size={14} />}
                    {enriching ? 'Enriching…' : 'Enrich Medicine'}
                  </button>
                )}
                <button
                  onClick={() => onAddToInventory(medicine)}
                  className="flex items-center gap-1.5 bg-[#346560] hover:bg-[#2b5450] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl transition-colors"
                >
                  <FiPlus size={15} /> Add to Inventory
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineDetailsModal;
