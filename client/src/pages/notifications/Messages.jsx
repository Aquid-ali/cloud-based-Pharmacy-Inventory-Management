import React from 'react';
import { FiMail, FiInbox, FiEye } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { messagesData } from '../../config/mockData';

const columns = [
  { key: 'from', label: 'From' },
  { key: 'subject', label: 'Subject' },
  { key: 'date', label: 'Date' },
  {
    key: 'read',
    label: 'Status',
    render: (row) => (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${row.read ? 'text-slate-400' : 'text-[#346560]'}`}>
        <FiEye size={12} />
        {row.read ? 'Read' : 'Unread'}
      </span>
    ),
  },
];

const Messages = () => (
  <ListPage
    title="Messages"
    description="Internal and external communications for your pharmacy."
    stats={[
      { icon: FiMail, label: 'Total Messages', value: messagesData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiInbox, label: 'Unread', value: messagesData.filter((m) => !m.read).length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
    columns={columns}
    data={messagesData}
    searchPlaceholder="Search messages..."
    addLabel="Compose"
  />
);

export default Messages;
