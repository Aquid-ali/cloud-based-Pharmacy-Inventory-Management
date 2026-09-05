import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMessageCircle } from 'react-icons/fi';
import { getPharmacyConversations } from '../services/conversationService';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import useAuth from '../hooks/useAuth';
import useInterval from '../hooks/useInterval';

const LIST_POLL_MS = 15000;

const PharmacyMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevUnreadRef = useRef(new Map());

  const fetchConversations = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const { data } = await getPharmacyConversations();
        const list = data.data.conversations;

        list.forEach((c) => {
          const prev = prevUnreadRef.current.get(c._id) || 0;
          if (isBackground && c.pharmacyUnreadCount > prev && c._id !== conversationId) {
            toast(
              (t) => (
                <span className="flex items-center gap-3">
                  <span>💬 New message from {c.customerId?.fullName || 'a customer'}</span>
                  <button
                    className="text-brandPrimary font-semibold text-xs shrink-0"
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate(`/messages/${c._id}`);
                    }}
                  >
                    Open Chat
                  </button>
                </span>
              ),
              { duration: 6000 }
            );
          }
          prevUnreadRef.current.set(c._id, c.pharmacyUnreadCount);
        });

        setConversations(list);
      } catch {
        if (!isBackground) toast.error("We couldn't load your conversations.");
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [conversationId, navigate]
  );

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useInterval(() => fetchConversations(true), LIST_POLL_MS);

  const selected = conversations.find((c) => c._id === conversationId);
  const showListOnMobile = !conversationId;

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="Conversations with customers about your medicines and stock." />

      <div className="h-[calc(100vh-16rem)] min-h-[28rem] bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[340px_1fr]">
        <div className={`${showListOnMobile ? 'block' : 'hidden'} md:block border-r border-slate-100 h-full`}>
          <ConversationList
            conversations={conversations}
            loading={loading}
            selectedId={conversationId}
            onSelect={(id) => navigate(`/messages/${id}`)}
            getTitle={(c) => c.customerId?.fullName || 'Customer'}
            getSubtitle={(c) => c.lastMessageText || 'No messages yet'}
            getUnread={(c) => c.pharmacyUnreadCount}
            emptyTitle="No conversations yet"
            emptyMessage="Customer messages about medicines and stock will show up here."
          />
        </div>

        <div className={`${showListOnMobile ? 'hidden' : 'block'} md:block h-full`}>
          {selected ? (
            <ChatWindow
              key={conversationId}
              conversationId={conversationId}
              currentUserId={user._id}
              title={selected.customerId?.fullName || 'Customer'}
              subtitle={selected.customerId?.phone || selected.customerId?.email}
              onBack={() => navigate('/messages')}
            />
          ) : conversationId && !loading ? (
            <div className="h-full flex items-center justify-center p-6">
              <EmptyState title="Conversation not found" message="It may have been removed." />
            </div>
          ) : (
            <div className="hidden md:flex h-full items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <div className="w-14 h-14 rounded-3xl bg-primary-50 text-brandPrimary flex items-center justify-center mx-auto mb-3">
                  <FiMessageCircle size={26} />
                </div>
                <p className="text-sm font-semibold text-ink mb-1">Select a conversation</p>
                <p className="text-xs text-ink-faint">Choose a customer from the list to view messages.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyMessages;
