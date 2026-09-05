import React, { useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import FormField from '../FormField';
import EmptyState from '../EmptyState';
import { SkeletonRows } from '../Skeleton';
import ConversationListItem from './ConversationListItem';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

/**
 * Role-agnostic conversation list - title/subtitle/unread are read via
 * caller-supplied accessor functions so the same component serves both the
 * customer ("pharmacy name") and pharmacy ("customer name") inboxes.
 */
const ConversationList = ({
  conversations,
  loading,
  selectedId,
  onSelect,
  getTitle,
  getSubtitle,
  getUnread,
  emptyTitle,
  emptyMessage,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = conversations;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => getTitle(c).toLowerCase().includes(q));
    if (filter === 'unread') list = list.filter((c) => getUnread(c) > 0);
    return list;
  }, [conversations, search, filter, getTitle, getUnread]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-100 space-y-2 shrink-0">
        <FormField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          icon={FiSearch}
        />
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === f.key
                  ? 'bg-brandPrimary text-white border-brandPrimary'
                  : 'bg-white text-ink-soft border-slate-200 hover:border-brandPrimary/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3">
            <SkeletonRows count={5} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          filtered.map((c) => (
            <ConversationListItem
              key={c._id}
              title={getTitle(c)}
              subtitle={getSubtitle(c)}
              timestamp={c.lastMessageAt}
              unread={getUnread(c)}
              selected={selectedId === c._id}
              onClick={() => onSelect(c._id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
