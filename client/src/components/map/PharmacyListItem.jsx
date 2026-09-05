import React from 'react';
import { FiMapPin, FiCheck } from 'react-icons/fi';
import { formatDistance } from '../../utils/distance';

/**
 * Compact, selectable list row - stays in sync with the map's marker
 * selection (see Stores.jsx's shared `selectedId` state). Action buttons
 * (View Pharmacy / Get Directions) live in PharmacyInfoCard once selected,
 * not duplicated here.
 */
const PharmacyListItem = ({ pharmacy, selected, isCurrent, onSelect }) => {
  const hasLocation = typeof pharmacy.location?.lat === 'number' && typeof pharmacy.location?.lng === 'number';

  return (
    <button
      type="button"
      onClick={() => onSelect(pharmacy._id)}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 ${
        selected
          ? 'border-brandPrimary bg-primary-50/60 shadow-sm'
          : 'border-slate-200/80 bg-white hover:border-brandPrimary/30 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-ink text-sm leading-snug">{pharmacy.name}</h3>
        {pharmacy.distanceKm !== undefined ? (
          <span className="shrink-0 text-[11px] font-semibold text-brandPrimary bg-brandPrimary/10 px-2 py-1 rounded-full">
            {formatDistance(pharmacy.distanceKm)}
          </span>
        ) : !hasLocation ? (
          <span className="shrink-0 text-[10px] text-ink-faint italic">Location unavailable</span>
        ) : null}
      </div>
      <p className="flex items-start gap-1.5 text-xs text-ink-soft">
        <FiMapPin size={12} className="mt-0.5 shrink-0" />
        <span className="line-clamp-1">
          {pharmacy.address}, {pharmacy.city}
        </span>
      </p>
      {isCurrent && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
          <FiCheck size={12} /> Currently shopping here
        </p>
      )}
    </button>
  );
};

export default PharmacyListItem;
