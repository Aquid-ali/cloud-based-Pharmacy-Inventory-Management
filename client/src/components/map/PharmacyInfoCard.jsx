import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin, FiPhone, FiX, FiNavigation, FiCheck, FiShoppingBag, FiMessageCircle, FiAlertCircle } from 'react-icons/fi';
import { TbCar, TbWalk, TbBike, TbBuildingHospital } from 'react-icons/tb';
import Button from '../Button';
import { formatDistance } from '../../utils/distance';
import { startConversation } from '../../services/conversationService';
import useAuth from '../../hooks/useAuth';

// A plain Google Maps URL scheme, not a billed Google Maps Platform API call
// - opens real turn-by-turn navigation in the user's own Maps app/tab.
const directionsUrl = (lat, lng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

const TRAVEL_MODES = [
  { key: 'DRIVING', label: 'Drive', icon: TbCar },
  { key: 'WALKING', label: 'Walk', icon: TbWalk },
  { key: 'BICYCLING', label: 'Bike', icon: TbBike },
];

/**
 * Detail panel for the currently-selected pharmacy. Floats over the map on
 * desktop, renders inline under the selected list row on mobile (see
 * Stores.jsx) - same component either way.
 */
const PharmacyInfoCard = ({
  pharmacy,
  isCurrent,
  onClose,
  onView,
  userLocation,
  activeTravelMode,
  onGetDirections,
  directionsLoading,
  directionsResult,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messaging, setMessaging] = useState(false);

  if (!pharmacy) return null;
  const hasLocation = typeof pharmacy.location?.lat === 'number' && typeof pharmacy.location?.lng === 'number';

  const handleMessage = async () => {
    setMessaging(true);
    try {
      await startConversation(pharmacy._id, { navigate, user });
    } catch {
      toast.error("Couldn't start a conversation. Please try again.");
    } finally {
      setMessaging(false);
    }
  };

  const externalMapsLink = hasLocation && (
    <a
      href={directionsUrl(pharmacy.location.lat, pharmacy.location.lng)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brandPrimary hover:text-brandPrimaryHover"
    >
      <FiNavigation size={13} /> Open in Google Maps
    </a>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-400 hover:text-ink p-1"
        aria-label="Close"
      >
        <FiX size={16} />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-brandPrimary flex items-center justify-center shrink-0">
          <TbBuildingHospital size={18} />
        </div>
        <h3 className="font-display text-base font-bold text-ink leading-snug pt-1.5">{pharmacy.name}</h3>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-ink-soft mt-3">
        <FiMapPin size={13} className="mt-0.5 shrink-0" />
        <span>
          {pharmacy.address}, {pharmacy.city}, {pharmacy.state} {pharmacy.pincode}
        </span>
      </p>

      {pharmacy.phone && (
        <p className="flex items-center gap-1.5 text-xs text-ink-soft mt-1.5">
          <FiPhone size={13} className="shrink-0" /> {pharmacy.phone}
        </p>
      )}

      {pharmacy.distanceKm !== undefined && (
        <p className="text-xs text-brandPrimary font-semibold mt-2">
          {formatDistance(pharmacy.distanceKm)} away, straight-line
        </p>
      )}

      {isCurrent ? (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-4">
          <FiCheck size={14} /> Currently shopping here
        </div>
      ) : (
        <Button size="sm" className="w-full mt-4" icon={FiShoppingBag} onClick={onView}>
          View Pharmacy
        </Button>
      )}

      {/* Directions - always shown, with copy explaining why it can't run
          yet rather than silently hiding the whole area. */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        {!hasLocation ? (
          <p className="flex items-start gap-1.5 text-xs text-ink-faint">
            <FiAlertCircle size={13} className="mt-0.5 shrink-0" />
            Directions aren&apos;t available because this pharmacy hasn&apos;t set a valid location yet.
          </p>
        ) : !userLocation ? (
          <div className="space-y-1.5">
            <p className="flex items-start gap-1.5 text-xs text-ink-faint">
              <FiAlertCircle size={13} className="mt-0.5 shrink-0" />
              Location access was denied. Enter your starting location or open the pharmacy location in Maps.
            </p>
            {externalMapsLink}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {TRAVEL_MODES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onGetDirections?.(key)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[11px] font-medium transition-colors ${
                    activeTravelMode === key
                      ? 'bg-brandPrimary text-white border-brandPrimary'
                      : 'bg-white text-ink-soft border-slate-200 hover:border-brandPrimary/40'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {directionsLoading ? (
              <p className="text-xs text-ink-faint">Calculating route…</p>
            ) : directionsResult?.error ? (
              <p className="text-xs text-rose-600">Unable to calculate directions right now. Please try again.</p>
            ) : directionsResult ? (
              <p className="text-xs text-ink font-medium">
                {directionsResult.distanceText} · {directionsResult.durationText} by{' '}
                {TRAVEL_MODES.find((m) => m.key === activeTravelMode)?.label.toLowerCase()}
              </p>
            ) : null}

            {externalMapsLink}
          </div>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="w-full mt-3"
        icon={FiMessageCircle}
        loading={messaging}
        onClick={handleMessage}
      >
        Message Pharmacy
      </Button>
    </div>
  );
};

export default PharmacyInfoCard;
