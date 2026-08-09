import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiUserPlus } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import useAuth from '../hooks/useAuth';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Pharmacist',
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
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#1c3734] flex flex-col items-center justify-center p-4 selection:bg-[#4ecdc4]/30 selection:text-white">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#284f4a] border border-white/10 flex items-center justify-center text-[#4ecdc4] shadow-lg shadow-black/20">
          <TbPill className="w-7 h-7 transform -rotate-45" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-tight leading-none">
            MedStock
          </h1>
          <p className="text-[#4ecdc4] text-xs font-medium tracking-wide mt-1">
            Pharmacy Cloud
          </p>
        </div>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl p-7 border border-white/10">
        {/* Segmented Tab Switcher */}
        <div className="bg-[#f7f5f4] p-1.5 rounded-2xl flex gap-1 mb-6 text-sm">
          <Link
            to="/login"
            className="flex-1 py-2.5 rounded-xl font-medium text-slate-500 hover:text-slate-800 transition-all text-center"
          >
            Sign in
          </Link>
          <button
            type="button"
            className="flex-1 py-2.5 rounded-xl font-medium text-slate-800 bg-white shadow-sm transition-all text-center"
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name Input */}
          <div className="relative">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl text-sm transition-all focus:outline-none placeholder:text-slate-400 ${
                errors.fullName
                  ? 'border-red-400 focus:ring-4 focus:ring-red-100'
                  : 'border-slate-200 focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10'
              }`}
            />
            {errors.fullName && <p className="text-xs text-red-500 mt-1 pl-2">{errors.fullName}</p>}
          </div>

          {/* Email Input */}
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl text-sm transition-all focus:outline-none placeholder:text-slate-400 ${
                errors.email
                  ? 'border-red-400 focus:ring-4 focus:ring-red-100'
                  : 'border-slate-200 focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1 pl-2">{errors.email}</p>}
          </div>

          {/* Password Input */}
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password (min. 6 chars)"
              className={`w-full pl-12 pr-12 py-3.5 border rounded-2xl text-sm transition-all focus:outline-none placeholder:text-slate-400 ${
                errors.password
                  ? 'border-red-400 focus:ring-4 focus:ring-red-100'
                  : 'border-slate-200 focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10'
              }`}
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

          {/* Role Select */}
          <div className="relative">
            <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm transition-all focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 text-slate-700 appearance-none bg-white cursor-pointer"
            >
              <option value="Pharmacist">Pharmacist</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#346560] hover:bg-[#2b5450] disabled:opacity-75 text-white font-medium py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#346560]/25 active:scale-[0.99]"
          >
            <FiUserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating account...' : 'Create account'}</span>
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-center text-[12.5px] text-slate-400 leading-relaxed mt-6 px-2">
          Demo authentication for this artifact. The included backend uses hashed passwords and JWT sessions.
        </p>
      </div>
    </div>
  );
};

export default Register;
