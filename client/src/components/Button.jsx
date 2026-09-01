import React from 'react';
import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'bg-tealPrimary hover:bg-tealHover text-white shadow-brand',
  secondary: 'bg-white hover:bg-slate-50 text-tealPrimary border border-tealPrimary/20',
  ghost: 'bg-transparent hover:bg-black/5 text-ink',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20',
};

const SIZES = {
  sm: 'text-xs px-4 py-2 rounded-xl gap-1.5',
  md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
  lg: 'text-sm px-6 py-3 rounded-2xl gap-2',
};

/**
 * Shared button primitive. Renders a <Link> when `to` is given, otherwise a
 * <button>. Consolidates the hand-rolled `bg-[#346560] ... rounded-2xl`
 * button block that was previously copy-pasted across ~10 files.
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  to,
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) => {
  const classes = `inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  const content = (
    <>
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
};

export default Button;
