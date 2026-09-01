import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import useAuth from '../hooks/useAuth';
import FormField from '../components/FormField';
import Button from '../components/Button';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    if (!form.password || form.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const success = await register(form);
    if (success) {
      const from = location.state?.from;
      navigate(from ? `${from.pathname}${from.search || ''}` : '/shop');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e9f7f5] to-white flex flex-col items-center justify-center p-4 selection:bg-[#4ecdc4]/30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-tealPrimary flex items-center justify-center text-white shadow-brand">
          <TbPill className="w-7 h-7 transform -rotate-45" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink tracking-tight leading-none">
            MedStock
          </h1>
          <p className="text-tealPrimary text-xs font-medium tracking-wide mt-1">
            Medicines, delivered
          </p>
        </div>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl shadow-slate-200 p-7 border border-slate-100">
        {/* Segmented Tab Switcher */}
        <div className="bg-[#f7f5f4] p-1.5 rounded-2xl flex gap-1 mb-6 text-sm">
          <Link
            to="/login"
            state={location.state}
            className="flex-1 py-2.5 rounded-xl font-medium text-slate-500 hover:text-ink transition-all text-center"
          >
            Sign in
          </Link>
          <button
            type="button"
            className="flex-1 py-2.5 rounded-xl font-medium text-ink bg-white shadow-sm transition-all text-center"
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            icon={FiUser}
            error={errors.fullName}
          />

          <FormField
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            icon={FiMail}
            error={errors.email}
          />

          <FormField
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password (min. 6 chars)"
            icon={FiLock}
            error={errors.password}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            }
          />

          <Button type="submit" loading={loading} size="lg" className="w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        {/* Footer Note */}
        <p className="text-center text-[12.5px] text-slate-400 leading-relaxed mt-6 px-2">
          Search medicines, find nearby stores, and track your orders.
        </p>
      </div>
    </div>
  );
};

export default Register;
