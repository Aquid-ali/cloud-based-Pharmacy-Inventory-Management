import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheckCircle, FiRefreshCw, FiEdit2, FiAlertTriangle } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { getNeedsReview, approveReview, enrichMedicine, updateMedicineNameAndRetry } from '../../services/medicineEnrichmentService';

const ProposalField = ({ label, value }) => {
  if (!value) return null;
  const text = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <p className="text-sm text-slate-700">{text}</p>
    </div>
  );
};

const ReviewCard = ({ medicine, onResolved }) => {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(medicine.name);
  const proposal = medicine.enrichmentProposal || {};

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approveReview(medicine._id);
      toast.success('Enrichment approved and applied.');
      onResolved(medicine._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    setBusy(true);
    try {
      const { data } = await enrichMedicine(medicine._id, true);
      toast.success(data.message);
      if (data.data.outcome === 'completed') onResolved(medicine._id);
      else onResolved(medicine._id, data.data.medicine);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameDraft.trim() || nameDraft.trim() === medicine.name) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      const { data } = await updateMedicineNameAndRetry(medicine._id, nameDraft.trim());
      toast.success(data.message);
      setEditing(false);
      if (data.data.outcome === 'completed') onResolved(medicine._id);
      else onResolved(medicine._id, data.data.medicine);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update name');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Medicine name (as stored)</span>
          {editing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <button onClick={handleSaveName} disabled={busy} className="text-xs font-semibold text-white bg-[#346560] px-3 py-2 rounded-xl disabled:opacity-50">
                Save & Re-enrich
              </button>
              <button onClick={() => setEditing(false)} className="text-xs text-slate-500 px-2">Cancel</button>
            </div>
          ) : (
            <h3 className="text-base font-bold text-slate-900 font-serif">{medicine.name}</h3>
          )}
          <p className="text-xs text-slate-500 mt-0.5">{medicine.manufacturer}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 shrink-0">
          <FiAlertTriangle size={12} /> {medicine.enrichmentConfidence ? `${medicine.enrichmentConfidence}% confidence` : 'Needs Review'}
        </span>
      </div>

      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Reason for review</span>
        <p className="text-sm text-amber-800 mt-0.5">{medicine.enrichmentError || 'Unable to confidently identify medicine'}</p>
      </div>

      {Object.keys(proposal).length > 0 && (
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">AI's possible identification (not yet applied)</span>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            <ProposalField label="Generic Name" value={proposal.genericName} />
            <ProposalField label="Brand Name" value={proposal.brandName} />
            <ProposalField label="Composition" value={proposal.composition} />
            <ProposalField label="Strength / Dosage Form" value={[proposal.strength, proposal.dosageForm].filter(Boolean).join(' · ')} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={handleApprove}
          disabled={busy || Object.keys(proposal).length === 0}
          title={Object.keys(proposal).length === 0 ? 'No proposal to approve - try Retry first' : ''}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#346560] hover:bg-[#2b5450] px-4 py-2 rounded-xl disabled:opacity-40"
        >
          <FiCheckCircle size={14} /> Approve
        </button>
        <button
          onClick={handleRetry}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl disabled:opacity-40"
        >
          <FiRefreshCw size={14} /> Retry
        </button>
        <button
          onClick={() => setEditing(true)}
          disabled={busy || editing}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl disabled:opacity-40"
        >
          <FiEdit2 size={14} /> Edit Medicine Name
        </button>
      </div>
    </div>
  );
};

const MedicineReview = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getNeedsReview({ limit: 50 });
      setMedicines(data.data.medicines);
    } catch {
      toast.error('Failed to load medicines needing review');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Remove a resolved card (approved/completed), or replace it with the
  // updated doc if it's still needs_review after a retry/name edit.
  const handleResolved = (id, updatedMedicine) => {
    setMedicines((prev) =>
      updatedMedicine ? prev.map((m) => (m._id === id ? updatedMedicine : m)) : prev.filter((m) => m._id !== id)
    );
  };

  return (
    <div className="space-y-6">
      <Link to="/medicine-data" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#346560]">
        <FiArrowLeft size={14} /> Back to Medicine Data Management
      </Link>

      <PageHeader
        title="Review Medicines"
        description="Medicines the AI could not confidently identify. Approve its best guess, retry, or correct the name."
      />

      {loading ? (
        <Spinner size="lg" />
      ) : medicines.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center">
          <FiCheckCircle className="mx-auto text-emerald-500 mb-3" size={32} />
          <p className="text-sm text-slate-500">Nothing needs review right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {medicines.map((m) => (
            <ReviewCard key={m._id} medicine={m} onResolved={handleResolved} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineReview;
