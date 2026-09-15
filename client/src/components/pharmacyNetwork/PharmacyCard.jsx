import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiMapPin } from 'react-icons/fi';
import ConnectionActionButton from './ConnectionActionButton';

const PharmacyCard = ({ pharmacy, connection, onSendRequest, onCancel, onAccept, onDecline, onBlock, onUnblock, onMessage }) => (
  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <Link to={`/network/find/${pharmacy._id}`} className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-2xl bg-primary-50 text-brandPrimary flex items-center justify-center font-display font-bold text-lg shrink-0">
        {pharmacy.name?.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-ink truncate">{pharmacy.name}</h3>
          {pharmacy.isVerified && <FiCheckCircle className="text-brandPrimary shrink-0" size={14} title="Verified Pharmacy" />}
        </div>
        <p className="text-xs text-ink-faint flex items-center gap-1 mt-0.5">
          <FiMapPin size={11} className="shrink-0" />
          {pharmacy.city}, {pharmacy.state}
        </p>
      </div>
    </Link>

    <div className="flex items-center justify-between gap-2 mt-1">
      <Link to={`/network/find/${pharmacy._id}`} className="text-xs font-semibold text-brandPrimary hover:underline">
        View Profile
      </Link>
      <ConnectionActionButton
        connection={connection}
        otherPharmacyId={pharmacy._id}
        otherPharmacyStatus={pharmacy.status}
        onSendRequest={onSendRequest}
        onCancel={onCancel}
        onAccept={onAccept}
        onDecline={onDecline}
        onBlock={onBlock}
        onUnblock={onUnblock}
        onMessage={onMessage}
      />
    </div>
  </div>
);

export default PharmacyCard;
