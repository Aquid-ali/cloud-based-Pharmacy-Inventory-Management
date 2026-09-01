import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiHome, FiMapPin } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import useAuth from '../../hooks/useAuth';

const highlights = [
  { icon: FiHome, text: 'Creates your pharmacy record and links it to your admin account automatically.' },
  { icon: FiShield, text: 'Your inventory stays private to your pharmacy — no other admin can see or edit it.' },
];

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  pharmacyName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
};

const AdminRegister = () => {
  const { registerAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.pharmacyName.trim()) errs.pharmacyName = 'Pharmacy name is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!form.pincode.trim()) errs.pincode = 'Pincode is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const success = await registerAdmin(form);
    if (success) navigate('/dashboard');
  };

  const inputClass = (field) =>
    `w-full pl-12 pr-4 py-3 border rounded-2xl text-sm transition-all focus:outline-none placeholder:text-slate-400 ${
      errors[field]
        ? 'border-red-400 focus:ring-4 focus:ring-red-100'
        : 'border-slate-200 focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10'
    }`;

  return (
    <div className="min-h-screen flex selection:bg-[#4ecdc4]/30 selection:text-white">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-2/5 bg-[#1c3734] relative overflow-hidden flex-col justify-between p-12 xl:p-16">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-[#4ecdc4]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-0 w-72 h-72 bg-[#346560]/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-[#284f4a] border border-white/10 flex items-center justify-center text-[#4ecdc4] shadow-lg shadow-black/20">
              <TbPill className="w-7 h-7 transform -rotate-45" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white tracking-tight leading-none">MedStock</h1>
              <p className="text-[#4ecdc4] text-xs font-medium tracking-wide mt-1">Pharmacy Cloud — Admin</p>
            </div>
          </div>

          <h2 className="font-serif text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Bring your pharmacy<br />online in minutes.
          </h2>
        </div>

        <div className="relative space-y-5">
          {highlights.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#4ecdc4] shrink-0">
                <Icon size={16} />
              </div>
              <p className="text-white/70 text-sm leading-relaxed pt-1.5">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#f6f8f8]">
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-[#1c3734] flex items-center justify-center text-[#4ecdc4]">
            <TbPill className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-slate-800 tracking-tight leading-none">MedStock</h1>
            <p className="text-[#346560] text-xs font-medium tracking-wide mt-1">Pharmacy Cloud — Admin</p>
          </div>
        </div>

        <div className="w-full max-w-md bg-white rounded-[28px] shadow-xl shadow-slate-200/70 p-7 sm:p-9 border border-slate-100">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#346560]/10 text-[#346560] flex items-center justify-center shrink-0">
              <FiHome size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 leading-tight">Create your pharmacy account</h2>
              <p className="text-xs text-slate-400 mt-0.5">You'll be signed in immediately after</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">Your account</p>

            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Full name"
                className={inputClass('fullName')}
              />
              {errors.fullName && <p className="text-xs text-red-500 mt-1 pl-2">{errors.fullName}</p>}
            </div>

            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className={inputClass('email')}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1 pl-2">{errors.email}</p>}
            </div>

            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password (min. 6 chars)"
                className={`${inputClass('password')} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
              {errors.password && <p className="text-xs text-red-500 mt-1 pl-2">{errors.password}</p>}
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">Your pharmacy</p>

            <div className="relative">
              <FiHome className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                name="pharmacyName"
                value={form.pharmacyName}
                onChange={handleChange}
                placeholder="Pharmacy name"
                className={inputClass('pharmacyName')}
              />
              {errors.pharmacyName && <p className="text-xs text-red-500 mt-1 pl-2">{errors.pharmacyName}</p>}
            </div>

            <div className="relative">
              <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Address"
                className={inputClass('address')}
              />
              {errors.address && <p className="text-xs text-red-500 mt-1 pl-2">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  className={`px-4 py-3 border rounded-2xl text-sm w-full focus:outline-none placeholder:text-slate-400 ${
                    errors.city ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10'
                  }`}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1 pl-2">{errors.city}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State"
                  className={`px-4 py-3 border rounded-2xl text-sm w-full focus:outline-none placeholder:text-slate-400 ${
                    errors.state ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10'
                  }`}
                />
                {errors.state && <p className="text-xs text-red-500 mt-1 pl-2">{errors.state}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                  className={`px-4 py-3 border rounded-2xl text-sm w-full focus:outline-none placeholder:text-slate-400 ${
                    errors.pincode ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10'
                  }`}
                />
                {errors.pincode && <p className="text-xs text-red-500 mt-1 pl-2">{errors.pincode}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone (optional)"
                  className="px-4 py-3 border border-slate-200 rounded-2xl text-sm w-full focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#346560] hover:bg-[#2b5450] disabled:opacity-75 text-white font-medium py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#346560]/25 active:scale-[0.99]"
            >
              <FiShield className="w-4 h-4" />
              <span>{loading ? 'Creating account...' : 'Create pharmacy account'}</span>
            </button>
          </form>
        </div>

        <Link to="/admin/login" className="mt-6 text-xs text-slate-400 hover:text-[#346560] transition-colors">
          Already have an account? Admin sign in
        </Link>
      </div>
    </div>
  );
};

export default AdminRegister;
