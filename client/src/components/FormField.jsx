import React from 'react';

/**
 * Shared label + input/select/textarea + optional leading icon + error text.
 * Consolidates the `border-slate-200 focus:border-[#346560] focus:ring-4
 * focus:ring-[#346560]/10` pattern that was previously copy-pasted across
 * Login, Register, Checkout, Account, and various search boxes.
 */
const FormField = ({
  label,
  icon: Icon,
  error,
  as = 'input',
  trailing,
  className = '',
  inputClassName = '',
  children,
  ...rest
}) => {
  const Tag = as;

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-ink-soft mb-1.5 pl-1">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        )}
        <Tag
          className={`w-full bg-white ${Icon ? 'pl-12' : 'pl-4'} ${trailing ? 'pr-12' : 'pr-4'} py-3.5 border rounded-2xl text-sm transition-all focus:outline-none placeholder:text-slate-400 ${
            error
              ? 'border-red-400 focus:ring-4 focus:ring-red-100'
              : 'border-slate-200 focus:border-tealPrimary focus:ring-4 focus:ring-tealPrimary/10'
          } ${as === 'select' ? 'appearance-none' : ''} ${inputClassName}`}
          {...rest}
        >
          {children}
        </Tag>
        {trailing && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1 pl-2">{error}</p>}
    </div>
  );
};

export default FormField;
