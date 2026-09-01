import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiMap, FiPackage, FiUsers } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import useAuth from '../../hooks/useAuth';

const highlights = [
  { icon: FiMap, text: 'Every admin account is scoped to a single store — its own stock, its own orders.' },
  { icon: FiPackage, text: 'Manage inventory in real time and see it reflected instantly for shoppers.' },
  { icon: FiUsers, text: 'Track and update customer orders as they come in, from placed to delivered.' },
];

const AdminLogin = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const success = await login(form, { expectedRole: 'Admin' });
    if (success) navigate('/dashboard');
  };

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
            Run your store's<br />inventory &amp; orders<br />from one place.
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
        {/* Mobile brand header (hidden on desktop, shown when the left panel is hidden) */}
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
          <div className="mb-7 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#346560]/10 text-[#346560] flex items-center justify-center shrink-0">
              <FiShield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 leading-tight">Admin sign in</h2>
              <p className="text-xs text-slate-400 mt-0.5">Internal dashboard access only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                placeholder="Password"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#346560] hover:bg-[#2b5450] disabled:opacity-75 text-white font-medium py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#346560]/25 active:scale-[0.99]"
            >
              <FiShield className="w-4 h-4" />
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-center text-[12.5px] text-slate-400 leading-relaxed mt-6 px-2">
            New pharmacy?{' '}
            <Link to="/admin/register" className="text-[#346560] font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <Link
          to="/login"
          className="mt-6 text-xs text-slate-400 hover:text-[#346560] transition-colors"
        >
          Looking to shop instead? Customer sign in
        </Link>
      </div>
    </div>
  );
};

export default AdminLogin;
