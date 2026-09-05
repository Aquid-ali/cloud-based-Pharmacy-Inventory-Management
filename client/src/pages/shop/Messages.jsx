import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMessageCircle } from 'react-icons/fi';
import { getCustomerConversations } from '../../services/conversationService';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import useAuth from '../../hooks/useAuth';
import useInterval from '../../hooks/useInterval';

const LIST_POLL_MS = 15000;

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevUnreadRef = useRef(new Map());

  const fetchConversations = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const { data } = await getCustomerConversations();
        const list = data.data.conversations;

        // Toast a notification for any conversation whose unread count just
        // increased while it isn't the one currently open.
        list.forEach((c) => {
          const prev = prevUnreadRef.current.get(c._id) || 0;
          if (isBackground && c.customerUnreadCount > prev && c._id !== conversationId) {
            toast(
              (t) => (
                <span className="flex items-center gap-3">
                  <span>💬 New reply from {c.pharmacyId?.name || 'a pharmacy'}</span>
                  <button
                    className="text-brandPrimary font-semibold text-xs shrink-0"
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate(`/shop/messages/${c._id}`);
                    }}
                  >
                    Open Chat
                  </button>
                </span>
              ),
              { duration: 6000 }
            );
          }
          prevUnreadRef.current.set(c._id, c.customerUnreadCount);
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
    <div className="h-[calc(100vh-8.5rem)] min-h-[28rem] bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[340px_1fr]">
      <div className={`${showListOnMobile ? 'block' : 'hidden'} md:block border-r border-slate-100 h-full`}>
        <ConversationList
          conversations={conversations}
          loading={loading}
          selectedId={conversationId}
          onSelect={(id) => navigate(`/shop/messages/${id}`)}
          getTitle={(c) => c.pharmacyId?.name || 'Pharmacy'}
          getSubtitle={(c) => c.lastMessageText || 'No messages yet'}
          getUnread={(c) => c.customerUnreadCount}
          emptyTitle="No conversations yet"
          emptyMessage="Message a pharmacy to ask about medicine availability, products, or pricing."
        />
      </div>

      <div className={`${showListOnMobile ? 'hidden' : 'block'} md:block h-full`}>
        {selected ? (
          <ChatWindow
            key={conversationId}
            conversationId={conversationId}
            currentUserId={user._id}
            title={selected.pharmacyId?.name || 'Pharmacy'}
            subtitle={[selected.pharmacyId?.city, selected.pharmacyId?.state].filter(Boolean).join(', ')}
            onBack={() => navigate('/shop/messages')}
            initialText={location.state?.prefillText || ''}
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
              <p className="text-xs text-ink-faint mb-4">Choose a pharmacy from the list to view your messages.</p>
              <Button to="/shop/stores" size="sm" variant="secondary">
                Find Pharmacies
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
