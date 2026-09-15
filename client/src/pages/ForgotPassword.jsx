import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiCheckCircle } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import FormField from '../components/FormField';
import Button from '../components/Button';
import { forgotPasswordRequest } from '../services/authService';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const validate = () => {
    if (!email.trim()) return 'Email is required';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { data } = await forgotPasswordRequest(email.trim());
      toast.success(data?.message || "If an account exists with this email, we've sent a password reset link.");
      setSubmitted(true);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Something went wrong. Please check your connection and try again.'
      );
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
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-7 h-7" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink mb-2">Check your email</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              If an account exists for <span className="font-medium text-ink">{email.trim()}</span>, we've sent a
              password reset link. It expires in 30 minutes.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3.5 rounded-2xl font-semibold text-sm bg-brandPrimary hover:bg-brandPrimaryHover text-white shadow-brand transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-ink mb-1.5">Forgot Password?</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormField
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={handleChange}
                placeholder="you@example.com"
                icon={FiMail}
                error={error}
                aria-invalid={!!error}
                aria-describedby={error ? 'forgot-password-email-error' : undefined}
              />

              <Button type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
