import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import Button from './Button';

/**
 * Shared inline "something went wrong" block, for when a fetch fails and a
 * toast alone would leave the page looking broken/empty. Mirrors
 * EmptyState.jsx's shape - same container, rose icon instead of neutral,
 * with an optional retry action.
 */
const ErrorState = ({
  title = "Something went wrong",
  message = 'Please try again.',
  onRetry,
  retryLabel = 'Try again',
}) => (
  <div className="py-16 text-center flex flex-col items-center justify-center p-6">
    <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
      <FiAlertCircle size={32} />
    </div>
    <h3 className="text-base font-bold text-slate-800 font-display mb-1">{title}</h3>
    <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">{message}</p>
    {onRetry && (
      <Button size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
  </div>
);

export default ErrorState;
