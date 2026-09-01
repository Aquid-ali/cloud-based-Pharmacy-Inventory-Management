import React from 'react';

/** Base pulsing block. Compose into page-specific skeleton layouts. */
export const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/70 rounded-xl ${className}`} />
);

/** Grid of medicine-card-shaped placeholders, for catalog/search loading states. */
export const SkeletonCardGrid = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-3xl border border-slate-100 bg-white p-4 space-y-3">
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-3 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <SkeletonBlock className="h-8 w-full mt-2" />
      </div>
    ))}
  </div>
);

/** Full detail-page shaped placeholder: image/title block + a few text lines. */
export const SkeletonDetail = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-4">
      <SkeletonBlock className="h-8 w-2/3" />
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-40 w-full" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <SkeletonBlock className="h-4 w-4/6" />
    </div>
    <div className="space-y-3">
      <SkeletonBlock className="h-32 w-full" />
      <SkeletonBlock className="h-10 w-full" />
    </div>
  </div>
);

/** A handful of table/list row placeholders, for order and search lists. */
export const SkeletonRows = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBlock key={i} className="h-16 w-full" />
    ))}
  </div>
);
