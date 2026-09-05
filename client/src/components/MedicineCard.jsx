import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import NewBatchBadge from './NewBatchBadge';
import { stockTextTint } from '../utils/stockStatus';

const DOT_TINT = {
  'In Stock': 'bg-stock-in',
  'Low Stock': 'bg-stock-low',
  'Out of Stock': 'bg-stock-out',
  Expired: 'bg-rose-500',
};

/**
 * Single medicine-card implementation shared by the Pharmacy/Inventory grid
 * (price + stock status + pharmacy, via PharmacyMedicineCard.jsx) and the
 * MedicineCatalog-only grid (no price/stock - a catalog entry isn't tied to
 * one pharmacy's stock - via MedicineCatalogCard.jsx). Those two files are
 * now thin wrappers around this one, preserving their existing prop shapes
 * so call sites in shop/Home.jsx, shop/SearchResults.jsx, and
 * customer/MedicineSearch.jsx never needed to change.
 */
const MedicineCard = ({ medicine, status, expiringSoon, price, pharmacyName, composition }) => {
  const [imgError, setImgError] = useState(false);
  if (!medicine) return null;

  const showImage = medicine.imageUrl && !imgError;
  const outOfStock = status === 'Out of Stock';

  return (
    <Link
      to={`/customer/medicines/${medicine._id}`}
      className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-brandPrimary/30 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {medicine.newBatch && <NewBatchBadge />}
      <div className="p-5 pb-3 flex-1">
        <div className="w-full aspect-square rounded-xl bg-primary-50 flex items-center justify-center text-brandPrimary mb-3 overflow-hidden">
          {showImage ? (
            <img
              src={medicine.imageUrl}
              alt={medicine.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <TbPill className="w-10 h-10 transform -rotate-45" />
          )}
        </div>

        {status && (
          <p className={`flex items-center gap-1.5 text-[11px] font-semibold mb-1 ${stockTextTint[status] || 'text-ink-soft'}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_TINT[status] || 'bg-slate-300'}`} />
            {status}
            {expiringSoon && status !== 'Out of Stock' && ' · Expiring soon'}
          </p>
        )}

        <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2 min-h-[2.5em]">{medicine.name}</h3>

        {composition && <p className="text-xs text-ink-soft mt-1 line-clamp-1">{composition}</p>}
        <p className="text-xs text-ink-faint mt-0.5">{medicine.manufacturer}</p>

        {pharmacyName && (
          <p className="flex items-center gap-1 text-[11px] text-brandPrimary font-medium mt-1.5">
            <FiMapPin size={11} className="shrink-0" />
            <span className="truncate">{pharmacyName}</span>
          </p>
        )}
      </div>

      <div className="px-5 pb-5 flex items-center justify-between">
        <span className={price !== undefined ? `font-semibold ${outOfStock ? 'text-ink-faint' : 'text-ink'}` : ''}>
          {price !== undefined ? `₹${price.toFixed(2)}` : ''}
        </span>
        <span className="text-xs font-semibold text-brandPrimary group-hover:underline">View details</span>
      </div>
    </Link>
  );
};

export default MedicineCard;
