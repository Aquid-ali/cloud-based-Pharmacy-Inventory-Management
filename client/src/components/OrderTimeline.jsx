import React from 'react';
import { FiCheck, FiXCircle } from 'react-icons/fi';
import { ORDER_STEPS } from '../utils/orderStatus';

/**
 * Visual progress timeline for an order's real status enum (see
 * server/models/Order.js). Cancelled is a terminal branch, not a position
 * on the line — the model doesn't record which step it was cancelled at,
 * so it renders as a distinct callout instead of a faked line position.
 *
 * @param {string}   status        - Current order status.
 * @param {Array}    statusHistory - Optional statusHistory array from the order
 *                                   (each entry: { status, changedAt }). When
 *                                   provided, each completed step shows its
 *                                   timestamp below the label.
 */
const OrderTimeline = ({ status, statusHistory }) => {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-rose-700">
        <FiXCircle size={20} className="shrink-0" />
        <p className="text-sm font-medium">This order was cancelled.</p>
      </div>
    );
  }

  const currentIndex = ORDER_STEPS.indexOf(status);

  /**
   * Returns the most recent timestamp for a given status from statusHistory,
   * or null if no history is provided or the status hasn't been reached yet.
   */
  const getTimestamp = (step) => {
    if (!Array.isArray(statusHistory) || statusHistory.length === 0) return null;
    const entry = [...statusHistory].reverse().find((h) => h.status === step);
    if (!entry) return null;
    const d = new Date(entry.changedAt);
    return (
      d.toLocaleDateString() +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <ol className="flex items-start">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === ORDER_STEPS.length - 1;
        const ts = getTimestamp(step);
        return (
          <li key={step} className={'flex items-center ' + (isLast ? '' : 'flex-1')}>
            <div className="flex flex-col items-center">
              <span
                className={
                  'flex items-center justify-center w-7 h-7 rounded-full border-2 shrink-0 transition-colors ' +
                  (done
                    ? 'bg-brandPrimary border-brandPrimary text-white'
                    : 'bg-white border-slate-200 text-slate-300')
                }
              >
                {done ? <FiCheck size={14} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
              </span>
              <span
                className={
                  'mt-2 text-[11px] font-medium text-center w-20 ' +
                  (done ? 'text-ink' : 'text-slate-400')
                }
              >
                {step}
              </span>
              {ts && done && (
                <span className="mt-0.5 text-[9px] text-slate-400 text-center w-24 leading-tight">
                  {ts}
                </span>
              )}
            </div>
            {!isLast && (
              <div
                className={
                  'flex-1 h-0.5 ' +
                  (ts ? 'mb-10' : 'mb-5') +
                  ' ' +
                  (i < currentIndex ? 'bg-brandPrimary' : 'bg-slate-200')
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTimeline;
