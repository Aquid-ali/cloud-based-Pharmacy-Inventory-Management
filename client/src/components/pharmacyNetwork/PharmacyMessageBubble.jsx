import React from 'react';
import { FiCheck, FiCheckCircle, FiPackage, FiTrash2 } from 'react-icons/fi';
import { getPharmacyAttachmentUrl } from '../../services/pharmacyNetworkService';

const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ProductRequestCard = ({ productRequest, isOwn }) => (
  <div
    className={`w-64 max-w-full rounded-2xl border p-3 ${
      isOwn ? 'bg-brandPrimary/5 border-brandPrimary/20' : 'bg-white border-slate-200'
    }`}
  >
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-brandPrimary mb-1.5">
      <FiPackage size={13} />
      Product Request
    </div>
    <p className="text-sm font-bold text-ink">{productRequest.medicineName}</p>
    <p className="text-xs text-ink-soft mt-0.5">Requested quantity: {productRequest.quantityRequested}</p>
    {productRequest.note && <p className="text-xs text-ink-faint mt-1.5 italic">"{productRequest.note}"</p>}
  </div>
);

/**
 * Fork of the customer-chat MessageBubble - keeps the same own/other styling
 * and honest sent-vs-read receipt (no fabricated "delivered" state), and
 * adds deleted-message rendering + a Product Request card that the
 * customer-chat feature has no equivalent for.
 */
const PharmacyMessageBubble = ({ message, isOwn, onImageClick, onDelete }) => {
  if (message.deletedAt) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="px-4 py-2.5 rounded-2xl text-xs italic text-ink-faint bg-slate-100 border border-slate-200">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          {message.messageType === 'PRODUCT_REQUEST' ? (
            <ProductRequestCard productRequest={message.productRequest} isOwn={isOwn} />
          ) : (
            <div className="flex flex-col gap-1">
              {message.attachments?.length > 0 && (
                <div className={`grid gap-1 ${message.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {message.attachments.map((att) => (
                    <button
                      key={att.filename}
                      type="button"
                      onClick={() => onImageClick(getPharmacyAttachmentUrl(att.url))}
                      className="rounded-xl overflow-hidden border border-slate-200 bg-white"
                    >
                      <img src={getPharmacyAttachmentUrl(att.url)} alt="Attachment" className="w-full h-32 object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {message.text && (
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isOwn
                      ? 'bg-brandPrimary text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-ink rounded-bl-sm'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          )}
          {isOwn && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(message._id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-ink-faint hover:text-rose-500 shrink-0"
              aria-label="Delete message"
            >
              <FiTrash2 size={13} />
            </button>
          )}
        </div>
        <div className={`flex items-center gap-1 text-[10px] text-ink-faint px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn &&
            (message.readAt ? (
              <FiCheckCircle size={11} className="text-brandPrimary" />
            ) : (
              <FiCheck size={11} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default PharmacyMessageBubble;
