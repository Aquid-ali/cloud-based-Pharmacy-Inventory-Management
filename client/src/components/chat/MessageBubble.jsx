import React from 'react';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import { getAttachmentUrl } from '../../services/conversationService';

const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const MessageBubble = ({ message, isOwn, onImageClick }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      {message.attachments?.length > 0 && (
        <div className={`grid gap-1 ${message.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {message.attachments.map((att) => (
            <button
              key={att.filename}
              type="button"
              onClick={() => onImageClick(getAttachmentUrl(att.url))}
              className="rounded-xl overflow-hidden border border-slate-200 bg-white"
            >
              <img src={getAttachmentUrl(att.url)} alt="Attachment" className="w-full h-32 object-cover" />
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

export default MessageBubble;
