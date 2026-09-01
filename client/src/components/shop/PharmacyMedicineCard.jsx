import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import NewBatchBadge from '../NewBatchBadge';
import { stockTextTint } from '../../utils/stockStatus';

// Displays one live Inventory batch (joined with its catalog medicine + pharmacy).
// Purely informational - links to the existing customer medicine detail page
// (which already shows full cross-pharmacy availability) rather than offering
// its own "add to cart", since checkout isn't wired to Inventory yet.
const PharmacyMedicineCard = ({ item, showPharmacy = false }) => {
  const [imgError, setImgError] = useState(false);
  const medicine = item.medicine;
  const showImage = medicine?.imageUrl && !imgError;
  const outOfStock = item.status === 'Out of Stock';

  if (!medicine) return null;

  return (
    <Link
      to={`/customer/medicines/${medicine._id}`}
      className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
    >
      {medicine.newBatch && <NewBatchBadge />}
      <div className="p-5 pb-3 flex-1">
        <div className="w-full aspect-square rounded-xl bg-primary-50 flex items-center justify-center text-tealPrimary mb-3 overflow-hidden">
          {showImage ? (
            <img
              src={medicine.imageUrl}
              alt={medicine.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <TbPill className="w-10 h-10 transform -rotate-45" />
          )}
        </div>
        <p className={`text-[11px] font-semibold mb-1 ${stockTextTint[item.status] || 'text-ink-soft'}`}>
          {item.status}
          {item.expiringSoon && item.status !== 'Out of Stock' && ' · Expiring soon'}
        </p>
        <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2 min-h-[2.5em]">
          {medicine.name}
        </h3>
        <p className="text-xs text-ink-faint mt-0.5">{medicine.manufacturer}</p>
        {showPharmacy && item.pharmacy?.name && (
          <p className="flex items-center gap-1 text-[11px] text-tealPrimary font-medium mt-1.5">
            <FiMapPin size={11} className="shrink-0" />
            <span className="truncate">{item.pharmacy.name}</span>
          </p>
        )}
      </div>

      <div className="px-5 pb-5 flex items-center justify-between">
        <span className={`font-semibold ${outOfStock ? 'text-ink-faint' : 'text-ink'}`}>
          ₹{item.sellingPrice?.toFixed(2)}
        </span>
        <span className="text-xs font-semibold text-tealPrimary">View details</span>
      </div>
    </Link>
  );
};

export default PharmacyMedicineCard;
