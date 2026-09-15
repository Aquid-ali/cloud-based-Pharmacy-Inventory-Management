import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiCheckCircle, FiX } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import FormField from '../components/FormField';
import Button from '../components/Button';
import { resetPasswordRequest } from '../services/authService';
import { PASSWORD_RULES, isPasswordValid } from '../utils/passwordPolicy';

const REDIRECT_DELAY_MS = 3000;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => navigate('/login'), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const validate = () => {
    const errs = {};
    if (!isPasswordValid(password)) {
      errs.password = 'Password does not meet all requirements below';
    }
    if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setTokenInvalid(true);
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await resetPasswordRequest(token, password);
      toast.success(data?.message || 'Password reset successfully.');
      setSuccess(true);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 400 || status === 404) {
        setTokenInvalid(true);
        toast.error(message || 'This password reset link is invalid or has expired.');
      } else {
        toast.error(message || 'Something went wrong. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center p-4 selection:bg-accentCyan/30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brandPrimary flex items-center justify-center text-white shadow-brand">
          <TbPill className="w-7 h-7 transform -rotate-45" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight leading-none">MedStock</h1>
          <p className="text-brandPrimary text-xs font-medium tracking-wide mt-1">Medicines, delivered</p>
        </div>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl shadow-slate-200 p-7 border border-slate-100">
        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-7 h-7" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink mb-2">Password reset successfully</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              You can now log in with your new password. Redirecting you to login...
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3.5 rounded-2xl font-semibold text-sm bg-brandPrimary hover:bg-brandPrimaryHover text-white shadow-brand transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : tokenInvalid ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <FiX className="w-7 h-7" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink mb-2">Link invalid or expired</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              This password reset link is invalid or has expired. Reset links are only valid for 30 minutes and can
              only be used once.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center w-full py-3.5 rounded-2xl font-semibold text-sm bg-brandPrimary hover:bg-brandPrimaryHover text-white shadow-brand transition-colors"
            >
              Request a New Reset Link
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-ink mb-1.5">Reset Password</h2>
              <p className="text-sm text-slate-500 leading-relaxed">Choose a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormField
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                icon={FiLock}
                error={errors.password}
                aria-describedby="password-requirements"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                }
              />

              <ul id="password-requirements" className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-1">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        met ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      <FiCheck className={`w-3.5 h-3.5 flex-shrink-0 ${met ? 'opacity-100' : 'opacity-30'}`} />
                      {rule.label}
                    </li>
                  );
                })}
              </ul>

              <FormField
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                icon={FiLock}
                error={errors.confirmPassword}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                }
              />

              <Button type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Remembered your password?{' '}
              <Link to="/login" className="text-brandPrimary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
