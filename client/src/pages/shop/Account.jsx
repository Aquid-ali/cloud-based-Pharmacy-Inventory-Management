import React, { useState } from 'react';
import { FiUser, FiSave } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import FormField from '../../components/FormField';
import Button from '../../components/Button';

const Account = () => {
  const { user, updateProfile, loading } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(form);
  };

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-xl font-bold font-serif text-ink">My account</h1>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-tealPrimary text-white flex items-center justify-center text-lg font-bold">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{user?.fullName}</p>
            <p className="text-xs text-ink-faint">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full name" name="fullName" value={form.fullName} onChange={handleChange} icon={FiUser} />
          <FormField
            label="Phone number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 90000 00000"
          />

          <Button type="submit" loading={loading} icon={FiSave}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </div>

      {user?.addresses?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-ink mb-3">Saved address</h2>
          {user.addresses.map((addr, i) => (
            <p key={i} className="text-sm text-ink-soft leading-relaxed">
              {addr.fullName}<br />
              {addr.line1}, {addr.city}, {addr.state} {addr.pincode}<br />
              {addr.phone}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default Account;
