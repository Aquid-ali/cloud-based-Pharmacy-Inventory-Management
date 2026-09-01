import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { getPharmacyById, updatePharmacy } from '../../services/pharmacyService';
import useAuth from '../../hooks/useAuth';

const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1.5';

const buildForm = (pharmacy) => ({
  name: pharmacy?.name || '',
  address: pharmacy?.address || '',
  city: pharmacy?.city || '',
  state: pharmacy?.state || '',
  pincode: pharmacy?.pincode || '',
  phone: pharmacy?.phone || '',
  email: pharmacy?.email || '',
  status: pharmacy?.status || 'active',
});

const PharmacyProfile = () => {
  const { user, updateUser } = useAuth();
  const pharmacyId = user?.pharmacyId?._id || (typeof user?.pharmacyId === 'string' ? user.pharmacyId : null);

  const [pharmacy, setPharmacy] = useState(null);
  const [form, setForm] = useState(buildForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const { data } = await updatePharmacy(pharmacyId, form);
      const updated = data.data.pharmacy;
      setPharmacy(updated);
      setForm(buildForm(updated));
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
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-[#346560] text-white rounded-2xl text-sm font-semibold hover:bg-[#2a524e] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default PharmacyProfile;
