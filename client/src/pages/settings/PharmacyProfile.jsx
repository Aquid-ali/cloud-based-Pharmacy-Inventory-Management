import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiSmartphone, FiCheck } from 'react-icons/fi';
import QRCode from 'qrcode';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { getPharmacyById, updatePharmacy, uploadUpiQrCode, deleteUpiQrCode } from '../../services/pharmacyService';
import PharmacySingleLocationMap from '../../components/map/PharmacySingleLocationMap';
import useAuth from '../../hooks/useAuth';

const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brandPrimary/20 focus:border-brandPrimary';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1.5';

const buildForm = (pharmacy) => ({
  name: pharmacy?.name || '',
  address: pharmacy?.address || '',
  city: pharmacy?.city || '',
  state: pharmacy?.state || '',
  pincode: pharmacy?.pincode || '',
  phone: pharmacy?.phone || '',
  email: pharmacy?.email || '',
  upiId: pharmacy?.upiId || '',
  status: pharmacy?.status || 'active',
});

/** Resolve a server-relative path or data URL to a full URL. */
const toFullUrl = (urlOrPath) => {
  if (!urlOrPath) return null;
  if (
    urlOrPath.startsWith('data:') ||
    urlOrPath.startsWith('http://') ||
    urlOrPath.startsWith('https://') ||
    urlOrPath.startsWith('blob:')
  ) {
    return urlOrPath;
  }
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${cleanBase}${cleanPath}`;
};

const PharmacyProfile = () => {
  const { user, updateUser } = useAuth();
  const pharmacyId = user?.pharmacyId?._id || (typeof user?.pharmacyId === 'string' ? user.pharmacyId : null);

  const [pharmacy, setPharmacy] = useState(null);
  const [form, setForm] = useState(buildForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Set only when the admin drags the preview pin - takes priority over
  // re-geocoding the address on the next save, and is cleared once that
  // save succeeds (the fresh saved location becomes the new displayed one).
  const [manualLocation, setManualLocation] = useState(null);

  // ── UPI QR Code state ──
  const qrFileInputRef = useRef(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrDeleting, setQrDeleting] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState(null); // local object URL for immediate preview
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const savedQrCode = pharmacy?.upiQrCode || null;

  useEffect(() => {
    let cancelled = false;
    const activeUpi = form.upiId || (form.phone ? `${form.phone.replace(/[^0-9]/g, '')}@upi` : null);
    if (!savedQrCode && !qrPreviewUrl && activeUpi) {
      QRCode.toDataURL(
        `upi://pay?pa=${encodeURIComponent(activeUpi)}&pn=${encodeURIComponent(form.name || 'Pharmacy')}&cu=INR`,
        {
          width: 200,
          margin: 1,
          color: { dark: '#1e1b4b', light: '#ffffff' },
        }
      )
        .then((url) => {
          if (!cancelled) setGeneratedPreviewUrl(url);
        })
        .catch(() => {});
    } else {
      setGeneratedPreviewUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [form.upiId, form.phone, form.name, savedQrCode, qrPreviewUrl]);

  useEffect(() => {
    if (!pharmacyId) {
      setLoading(false);
      return;
    }
    const fetchPharmacy = async () => {
      setLoading(true);
      try {
        const { data } = await getPharmacyById(pharmacyId);
        setPharmacy(data.data.pharmacy);
        setForm(buildForm(data.data.pharmacy));
      } catch (error) {
        toast.error('Failed to load pharmacy profile');
      } finally {
        setLoading(false);
      }
    };
    fetchPharmacy();
  }, [pharmacyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = manualLocation ? { ...form, manualLocation } : form;
      const { data } = await updatePharmacy(pharmacyId, payload);
      const updated = data.data.pharmacy;
      setPharmacy(updated);
      setForm(buildForm(updated));
      setManualLocation(null);
      // Refresh the cached pharmacy name app-wide (Navbar, Dashboard, etc.)
      // immediately, without requiring the admin to log out and back in.
      updateUser({ pharmacyId: updated });
      toast.success('Pharmacy profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update pharmacy profile');
    } finally {
      setSaving(false);
    }
  };

  // ── UPI QR Code handlers ──
  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately show a local preview
    setImageError(false);
    setQrPreviewUrl(URL.createObjectURL(file));
    setQrUploading(true);
    try {
      const { data } = await uploadUpiQrCode(pharmacyId, file);
      setPharmacy((prev) => ({ ...prev, upiQrCode: data.data.upiQrCode }));
      setQrPreviewUrl(null); // revert to server URL
      toast.success('UPI QR code uploaded');
    } catch (error) {
      setQrPreviewUrl(null);
      toast.error(error.response?.data?.message || 'Failed to upload QR code');
    } finally {
      setQrUploading(false);
      // Reset input so the same file can be re-selected
      if (qrFileInputRef.current) qrFileInputRef.current.value = '';
    }
  };

  const handleQrDelete = async () => {
    if (!window.confirm('Delete the UPI QR code? Customers won\'t be able to pay via UPI until you upload a new one.')) return;
    setQrDeleting(true);
    try {
      await deleteUpiQrCode(pharmacyId);
      setPharmacy((prev) => ({ ...prev, upiQrCode: null }));
      setQrPreviewUrl(null);
      toast.success('UPI QR code deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete QR code');
    } finally {
      setQrDeleting(false);
    }
  };

  // The preview shows the pending manual pin position if the admin just
  // dragged it, otherwise the last-saved location from the server.
  const previewLocation = manualLocation || pharmacy?.location || null;

  // QR code display URL: local preview (while uploading) > server-saved path
  const displayQrUrl = qrPreviewUrl || toFullUrl(savedQrCode);
  const activePreviewSrc = displayQrUrl && !imageError ? displayQrUrl : generatedPreviewUrl;

  if (!pharmacyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pharmacy Profile" description="Manage your pharmacy business information and branding." />
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <EmptyState
            title="No pharmacy linked to this account"
            message="This admin account isn't associated with a pharmacy, so there's no pharmacy profile to manage here."
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pharmacy Profile" description="Manage your pharmacy business information and branding." />
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Profile"
        description={`Manage ${pharmacy?.name || 'your pharmacy'}'s business information.`}
      />

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Pharmacy Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input type="text" name="state" value={form.state} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Pincode</label>
            <input type="text" name="pincode" value={form.pincode} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>UPI ID / VPA (Optional)</label>
            <input
              type="text"
              name="upiId"
              value={form.upiId}
              onChange={handleChange}
              placeholder="e.g. apluspharm@okaxis"
              className={inputClass}
            />
            <p className="text-[11px] text-slate-400 mt-1">Used to generate dynamic QR codes if no custom image is uploaded.</p>
          </div>
        </div>

        <div>
          <label className={labelClass}>Location preview</label>
          <PharmacySingleLocationMap location={previewLocation} onDragEnd={setManualLocation} />
          <p className="text-[11px] text-slate-400 mt-1.5">
            {manualLocation
              ? 'Pin manually adjusted — this exact position will be saved (no re-geocoding) when you save.'
              : 'Saving a changed address automatically re-geocodes it. You can also drag the pin to correct minor inaccuracies.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-brandPrimary text-white rounded-2xl text-sm font-semibold hover:bg-brandPrimaryHover disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* ── UPI QR Code Management ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
            <FiSmartphone size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">UPI QR Code</h2>
            <p className="text-[11px] text-ink-faint">
              Upload your pharmacy's UPI QR code so customers can pay online during checkout.
            </p>
          </div>
        </div>

        {activePreviewSrc ? (
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* QR preview */}
            <div className="relative group flex flex-col items-center">
              <div className="w-48 h-48 rounded-2xl border-2 border-violet-200 bg-white p-2 flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src={activePreviewSrc}
                  alt="UPI QR Code"
                  onError={() => setImageError(true)}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </div>
              {qrUploading && (
                <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              )}
              <span className="mt-2 text-[11px] font-medium text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
                {displayQrUrl && !imageError ? 'Custom Store QR Code' : 'Auto-Generated QR Code'}
              </span>
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <label
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-2xl text-xs font-semibold cursor-pointer hover:bg-violet-100 transition-colors"
              >
                <FiUpload size={14} />
                {displayQrUrl && !imageError ? 'Replace Custom QR Code' : 'Upload Custom QR Code'}
                <input
                  ref={qrFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleQrUpload}
                />
              </label>
              {displayQrUrl && !imageError && (
                <button
                  type="button"
                  onClick={handleQrDelete}
                  disabled={qrDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 transition-colors"
                >
                  <FiTrash2 size={14} />
                  {qrDeleting ? 'Deleting...' : 'Delete Custom QR Code'}
                </button>
              )}
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Customers selecting UPI payment at checkout will see this QR code. 
                Supports JPEG, PNG, or WebP up to 5 MB.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-500 flex items-center justify-center mb-3">
              <FiSmartphone size={28} />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">No UPI QR code configured</p>
            <p className="text-xs text-slate-400 mb-4 text-center max-w-sm">
              Upload your pharmacy's UPI QR code image or enter your UPI ID in the profile above so customers can scan and pay during checkout.
            </p>
            <label
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brandPrimary text-white rounded-2xl text-sm font-semibold cursor-pointer hover:bg-brandPrimaryHover transition-colors"
            >
              <FiUpload size={16} />
              Upload QR Code
              <input
                ref={qrFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleQrUpload}
              />
            </label>
            {qrUploading && <Spinner size="sm" className="mt-3" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyProfile;

