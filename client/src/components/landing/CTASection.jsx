import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';

const CTASection = () => {
  const { user } = useAuth();

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 py-14">
      <div className="max-w-4xl mx-auto bg-primary-50 rounded-3xl p-8 sm:p-12 text-center border border-tealPrimary/10">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-3">Ready to find your medicines?</h2>
        <p className="text-sm text-ink-soft max-w-lg mx-auto mb-6">
          Search our catalog, compare pharmacies, and get the healthcare information you need.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/customer/medicines"
            className="flex items-center gap-2 bg-tealPrimary hover:bg-tealHover text-white text-sm font-semibold px-6 py-3 rounded-2xl transition-colors"
          >
            Browse All Medicines <FiArrowRight size={16} />
          </Link>
          {!user && (
            <Link
              to="/register"
              className="bg-white hover:bg-slate-50 text-tealPrimary text-sm font-semibold px-6 py-3 rounded-2xl border border-tealPrimary/20 transition-colors"
            >
              Create an Account
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
