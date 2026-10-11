import React, { useEffect, useState } from 'react';
import { FiX, FiSmartphone, FiCheckCircle, FiAlertCircle, FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { getPharmacyQrCode } from '../../services/pharmacyService';

/** Resolve a server-relative path or data URL to a fully qualified URL */
const toFullUrl = (urlOrPath) => {
  if (!urlOrPath) return null;
  if (
    urlOrPath.startsWith('data:') ||
    urlOrPath.startsWith('http://') ||
    urlOrPath.startsWith('https://') ||
    urlOrPath.startsWith('blob:')
  ) {
    return urlOrPath;
  }
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${cleanBase}${cleanPath}`;
};

/**
 * UPI QR Code payment modal shown at checkout when the customer selects
 * "UPI / Online Payment".
 * 
 * Guarantees a visible, scannable QR code by:
 * 1. Attempting to display the pharmacy's custom uploaded QR code.
 * 2. If no custom image exists OR if the image fails to load (404/CORP/network error),
 *    dynamically generating a standard NPCI UPI QR code on the client.
 * 3. Providing the pharmacy's UPI ID with a 1-click copy button and a direct app link.
 */
const UpiQrModal = ({
  pharmacyId,
  pharmacyName = 'Pharmacy',
  items = [],
  total = 0,
  onConfirm,
  onClose,
  confirming = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [serverQrUrl, setServerQrUrl] = useState(null);
  const [generatedQrUrl, setGeneratedQrUrl] = useState(null);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const prepareQr = async () => {
      try {
        setLoading(true);
        let resolvedUpiId = '';
        let fetchedQrCode = null;

        try {
          const { data } = await getPharmacyQrCode(pharmacyId);
          if (!cancelled && data?.data) {
            fetchedQrCode = data.data.upiQrCode || null;
            resolvedUpiId = data.data.upiId || '';
          }
        } catch {
          // If server call fails, proceed with fallback UPI ID
        }

        // Fallback UPI ID derived from pharmacy name if none returned
        if (!resolvedUpiId) {
          const cleanName = (pharmacyName || 'pharmacy').toLowerCase().replace(/[^a-z0-9]/g, '');
          resolvedUpiId = `${cleanName || 'pharmacy'}@upi`;
        }

        if (cancelled) return;
        setUpiId(resolvedUpiId);

        if (fetchedQrCode) {
          setServerQrUrl(toFullUrl(fetchedQrCode));
        }

        // Build official NPCI UPI intent URI:
        // upi://pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>
        const payableAmount = Number(total || 0).toFixed(2);
        const upiUri = `upi://pay?pa=${encodeURIComponent(resolvedUpiId)}&pn=${encodeURIComponent(
          pharmacyName || 'Pharmacy'
        )}&am=${payableAmount}&cu=INR&tn=${encodeURIComponent('Medicine Order')}`;

        // Generate high-resolution dynamic QR code data URL
        const dataUrl = await QRCode.toDataURL(upiUri, {
          width: 256,
          margin: 1,
          color: {
            dark: '#1e1b4b', // deep indigo
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });

        if (!cancelled) {
          setGeneratedQrUrl(dataUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to generate payment QR code. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    prepareQr();
    return () => {
      cancelled = true;
    };
  }, [pharmacyId, pharmacyName, total]);

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine which QR image to display:
  // Use uploaded QR if available and hasn't failed to load; otherwise use generated QR code
  const activeQrSrc = serverQrUrl && !imgLoadFailed ? serverQrUrl : generatedQrUrl;

  const upiIntentLink = `upi://pay?pa=${encodeURIComponent(upiId || 'pharmacy@upi')}&pn=${encodeURIComponent(
    pharmacyName || 'Pharmacy'
  )}&am=${Number(total || 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent('Medicine Order')}`;

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
          <div className="flex flex-col items-center justify-center py-14 space-y-3">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400">Preparing payment QR code...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FiAlertCircle size={40} className="text-rose-400 mb-3" />
            <p className="text-sm text-rose-600 max-w-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Left: QR Code & UPI ID Card */}
            <div className="flex flex-col items-center sm:w-64 shrink-0">
              <div className="w-56 h-56 rounded-2xl border-2 border-violet-200 bg-white p-3 flex items-center justify-center shadow-sm relative overflow-hidden">
                {activeQrSrc ? (
                  <img
                    src={activeQrSrc}
                    alt="UPI Payment QR Code"
                    onError={() => {
                      // If the custom uploaded image failed to load (404/CORP/error),
                      // automatically switch to the dynamic generated QR code
                      setImgLoadFailed(true);
                    }}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <Spinner size="md" />
                )}
              </div>

              <p className="text-xs text-slate-500 font-medium mt-2.5 text-center">
                Scan with any UPI app
              </p>
              <p className="text-[11px] text-slate-400 text-center">
                Google Pay • PhonePe • Paytm • BHIM
              </p>

              {/* UPI ID with copy button */}
              {upiId && (
                <div className="mt-3 w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">UPI ID</p>
                    <p className="text-xs font-mono font-medium text-slate-700 truncate">{upiId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                    title="Copy UPI ID"
                  >
                    {copied ? <FiCheck size={14} className="text-emerald-600" /> : <FiCopy size={14} />}
                  </button>
                </div>
              )}

              {/* Mobile direct pay link */}
              <a
                href={upiIntentLink}
                className="sm:hidden mt-2 text-xs text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1"
              >
                <span>Open in UPI app</span>
                <FiExternalLink size={12} />
              </a>
            </div>

            {/* Right: Order Details & Payment Guide */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
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
                  <span className="text-xl font-bold text-violet-600">₹{Number(total).toFixed(2)}</span>
                </div>

                <div className="mt-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-1">
                  <p className="text-xs text-amber-900 font-semibold">How to pay:</p>
                  <ol className="text-xs text-amber-800 list-decimal list-inside space-y-1">
                    <li>Open Google Pay, PhonePe, Paytm, or your banking app.</li>
                    <li>Scan the QR code above or pay to the UPI ID.</li>
                    <li>Verify the amount (<strong>₹{Number(total).toFixed(2)}</strong>) and complete payment.</li>
                    <li>Click <strong>"I've completed the payment"</strong> below.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={confirming}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {!loading && !error && (
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
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
