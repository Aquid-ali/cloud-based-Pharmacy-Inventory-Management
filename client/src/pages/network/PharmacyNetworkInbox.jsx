import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiShare2 } from 'react-icons/fi';
import { getMyPharmacyConversations } from '../../services/pharmacyNetworkService';
import ConversationList from '../../components/chat/ConversationList';
import PharmacyChatWindow from '../../components/pharmacyNetwork/PharmacyChatWindow';
import NetworkTabNav from '../../components/pharmacyNetwork/NetworkTabNav';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import useAuth from '../../hooks/useAuth';
import useInterval from '../../hooks/useInterval';
import usePharmacyNetworkBadge from '../../hooks/usePharmacyNetworkBadge';

const LIST_POLL_MS = 15000;

const PharmacyNetworkInbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { pendingRequestCount } = usePharmacyNetworkBadge();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevUnreadRef = useRef(new Map());

  const fetchConversations = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const { data } = await getMyPharmacyConversations();
        const list = data.data.conversations;

        list.forEach((c) => {
          const prev = prevUnreadRef.current.get(c._id) || 0;
          if (isBackground && c.unread > prev && c._id !== conversationId) {
            toast(
              (t) => (
                <span className="flex items-center gap-3">
                  <span>💬 New message from {c.otherPharmacy?.name || 'a pharmacy'}</span>
                  <button
                    className="text-brandPrimary font-semibold text-xs shrink-0"
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate(`/network/${c._id}`);
                    }}
                  >
                    Open Chat
                  </button>
                </span>
              ),
              { duration: 6000 }
            );
          }
          prevUnreadRef.current.set(c._id, c.unread);
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
  const myPharmacyId = user?.pharmacyId?._id || user?.pharmacyId;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pharmacy Network"
        description="Discover and message other pharmacies about stock, availability, and requests."
        action={<Button icon={FiShare2} to="/network/find">Find Pharmacies</Button>}
      />

      <NetworkTabNav pendingRequestCount={pendingRequestCount} hideOnMobile={!showListOnMobile} />

      <div className="h-[calc(100vh-19rem)] min-h-[26rem] bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[340px_1fr]">
        <div className={`${showListOnMobile ? 'block' : 'hidden'} md:block border-r border-slate-100 h-full`}>
          <ConversationList
            conversations={conversations}
            loading={loading}
            selectedId={conversationId}
            onSelect={(id) => navigate(`/network/${id}`)}
            getTitle={(c) => c.otherPharmacy?.name || 'Pharmacy'}
            getSubtitle={(c) => c.lastMessageText || 'No messages yet'}
            getUnread={(c) => c.unread}
            emptyTitle="No conversations yet"
            emptyMessage="Connect with another pharmacy to start a conversation."
          />
        </div>

        <div className={`${showListOnMobile ? 'hidden' : 'block'} md:block h-full`}>
          {selected ? (
            <PharmacyChatWindow
              key={conversationId}
              conversationId={conversationId}
              currentPharmacyId={myPharmacyId}
              title={selected.otherPharmacy?.name || 'Pharmacy'}
              subtitle={
                selected.otherPharmacy
                  ? `${selected.otherPharmacy.city}, ${selected.otherPharmacy.state}`
                  : undefined
              }
              onBack={() => navigate('/network')}
              disabled={selected.otherPharmacy?.status === 'inactive' || selected.blocked}
              disabledReason={
                selected.otherPharmacy?.status === 'inactive'
                  ? 'This pharmacy is currently inactive.'
                  : selected.blockedByMe
                  ? 'You have blocked this pharmacy. Unblock them from Requests to resume messaging.'
                  : 'You cannot message this pharmacy right now.'
              }
            />
          ) : conversationId && !loading ? (
            <div className="h-full flex items-center justify-center p-6">
              <EmptyState title="Conversation not found" message="It may have been removed." />
            </div>
          ) : (
            <div className="hidden md:flex h-full items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <div className="w-14 h-14 rounded-3xl bg-primary-50 text-brandPrimary flex items-center justify-center mx-auto mb-3">
                  <FiShare2 size={26} />
                </div>
                <p className="text-sm font-semibold text-ink mb-1">Select a conversation</p>
                <p className="text-xs text-ink-faint">Choose a pharmacy from the list to view messages.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyNetworkInbox;
