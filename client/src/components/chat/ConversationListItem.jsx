import React from 'react';

const timeAgo = (iso) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const ConversationListItem = ({ title, subtitle, timestamp, unread, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 border-b border-slate-100 transition-colors ${
      selected ? 'bg-primary-50' : 'bg-white hover:bg-slate-50'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <h3 className={`text-sm truncate ${unread > 0 ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{title}</h3>
      {timestamp && <span className="shrink-0 text-[10px] text-ink-faint">{timeAgo(timestamp)}</span>}
    </div>
    <div className="flex items-center justify-between gap-2 mt-1">
      <p className={`text-xs truncate ${unread > 0 ? 'text-ink font-medium' : 'text-ink-faint'}`}>{subtitle}</p>
      {unread > 0 && <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500" aria-label={`${unread} unread`} />}
    </div>
  </button>
);

export default ConversationListItem;
