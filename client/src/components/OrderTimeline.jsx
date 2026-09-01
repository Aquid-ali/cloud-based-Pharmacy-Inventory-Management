import React from 'react';
import { FiCheck, FiXCircle } from 'react-icons/fi';
import { ORDER_STEPS } from '../utils/orderStatus';

/**
 * Visual progress timeline for an order's real status enum (see
 * server/models/Order.js). Cancelled is a terminal branch, not a position
 * on the line — the model doesn't record which step it was cancelled at,
 * so it renders as a distinct callout instead of a faked line position.
 */
const OrderTimeline = ({ status }) => {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-rose-700">
        <FiXCircle size={20} className="shrink-0" />
        <p className="text-sm font-medium">This order was cancelled.</p>
      </div>
    );
  }

  const currentIndex = ORDER_STEPS.indexOf(status);

  return (
    <ol className="flex items-start">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === ORDER_STEPS.length - 1;
        return (
          <li key={step} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center">
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full border-2 shrink-0 transition-colors ${
                  done
                    ? 'bg-tealPrimary border-tealPrimary text-white'
                    : 'bg-white border-slate-200 text-slate-300'
                }`}
              >
                {done ? <FiCheck size={14} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
              </span>
              <span className={`mt-2 text-[11px] font-medium text-center w-20 ${done ? 'text-ink' : 'text-slate-400'}`}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mb-5 ${i < currentIndex ? 'bg-tealPrimary' : 'bg-slate-200'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTimeline;
