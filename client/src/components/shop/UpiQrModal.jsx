import React, { useEffect, useState } from 'react';
import { FiX, FiSmartphone, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { getPharmacyQrCode } from '../../services/pharmacyService';

/** Resolve a server-relative path like "uploads/qr-codes/abc.png" to a full URL. */
const toFullUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
  return `${base}${base.endsWith('/') ? '' : '/'}${relativePath}`;
};

/**
 * UPI QR Code payment modal shown at checkout when the customer selects
 * "UPI / Online Payment". Fetches the pharmacy's uploaded QR code and
 * displays it alongside order details. The customer scans the code with
 * any UPI app and confirms once done.
 *
 * Props:
 *   pharmacyId    - Mongo ObjectId of the pharmacy fulfilling the order
 *   pharmacyName  - human-readable name (for the header)
 *   items         - cart items (each has medicineName, quantity, sellingPrice / price)
 *   total         - total payable amount (₹)
 *   onConfirm     - called when customer clicks "I've completed payment"
 *   onClose       - close the modal (go back to checkout)
 *   confirming    - true while the order is being placed (disables button)
 */
const UpiQrModal = ({
  pharmacyId,
  pharmacyName,
  items,
  total,
  onConfirm,
  onClose,
  confirming = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchQr = async () => {
      try {
        const { data } = await getPharmacyQrCode(pharmacyId);
        if (!cancelled) {
          setQrUrl(data.data.upiQrCode);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load the pharmacy\'s QR code. Please try again or choose a different payment method.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchQr();
    return () => { cancelled = true; };
  }, [pharmacyId]);

  const fullQrUrl = toFullUrl(qrUrl);

  return (
    <Modal onClose={onClose} maxWidth="lg">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
              <FiSmartphone size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Pay via UPI</h2>
              <p className="text-xs text-ink-faint">{pharmacyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FiAlertCircle size={40} className="text-rose-400 mb-3" />
            <p className="text-sm text-rose-600 max-w-sm">{error}</p>
          </div>
        )}

        {!loading && !error && !fullQrUrl && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FiAlertCircle size={40} className="text-amber-400 mb-3" />
            <p className="text-sm text-slate-600 font-medium mb-1">QR code not available</p>
            <p className="text-xs text-slate-400 max-w-sm">
              This pharmacy hasn't uploaded a UPI QR code yet. Please choose Cash on Delivery or contact the pharmacy directly.
            </p>
          </div>
        )}

        {!loading && !error && fullQrUrl && (
          <div className="flex flex-col sm:flex-row gap-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="w-56 h-56 rounded-2xl border-2 border-violet-200 bg-violet-50/30 p-3 flex items-center justify-center">
                <img
                  src={fullQrUrl}
                  alt="UPI QR Code"
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Scan with any UPI app
              </p>
            </div>

            {/* Order Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Order Summary
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate mr-2">
                      {item.medicineName || item.name}{' '}
                      <span className="text-slate-400">× {item.quantity}</span>
                    </span>
                    <span className="text-slate-800 font-medium whitespace-nowrap">
                      ₹{((item.sellingPrice || item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Total Payable</span>
                <span className="text-lg font-bold text-violet-600">₹{total.toFixed(2)}</span>
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <p className="text-xs text-amber-800">
                  <strong>Steps:</strong> Open any UPI app (Google Pay, PhonePe, Paytm, etc.), 
                  scan the QR code, enter ₹{total.toFixed(2)} and complete the payment. 
                  Then click the button below to confirm.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={confirming}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {!loading && !error && fullQrUrl && (
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              <FiCheckCircle size={16} />
              {confirming ? 'Placing order...' : "I've completed the payment"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UpiQrModal;
