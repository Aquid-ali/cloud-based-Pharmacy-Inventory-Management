import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TbPill } from 'react-icons/tb';
import NewBatchBadge from '../NewBatchBadge';

const MedicineCatalogCard = ({ medicine }) => {
  const [imgError, setImgError] = useState(false);
  const showImage = medicine.imageUrl && !imgError;

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
        <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2 min-h-[2.5em]">
          {medicine.name}
        </h3>
        <p className="text-xs text-ink-soft mt-1 line-clamp-1">{medicine.composition}</p>
        <p className="text-xs text-ink-faint mt-0.5">{medicine.manufacturer}</p>
      </div>
    </Link>
  );
};

export default MedicineCatalogCard;
