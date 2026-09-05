import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { getMessages, sendMessage, markConversationRead } from '../../services/conversationService';
import MessageBubble from './MessageBubble';
import ChatComposer from './ChatComposer';
import ImageLightbox from './ImageLightbox';
import { SkeletonRows } from '../Skeleton';
import Button from '../Button';
import useInterval from '../../hooks/useInterval';

const POLL_MS = 4000;

/**
 * Role-agnostic chat pane - message fetch/send/read endpoints only care
 * whether the caller is a participant, not which side they're on, so this
 * is shared unchanged between the customer and pharmacy inboxes.
 */
const ChatWindow = ({ conversationId, currentUserId, title, subtitle, onBack, initialText }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const knownIds = useRef(new Set());
  const isNearBottomRef = useRef(true);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getMessages(conversationId, { limit: 30 });
      setMessages(data.data.messages);
      knownIds.current = new Set(data.data.messages.map((m) => m._id));
      setHasMore(data.data.hasMore);
      markConversationRead(conversationId).catch(() => {});
    } catch (err) {
      setError("We couldn't load this conversation. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const pollNew = useCallback(async () => {
    try {
      const { data } = await getMessages(conversationId, { limit: 30 });
      const fresh = data.data.messages.filter((m) => !knownIds.current.has(m._id));
      if (fresh.length > 0) {
        fresh.forEach((m) => knownIds.current.add(m._id));
        setMessages((prev) => [...prev, ...fresh]);
        markConversationRead(conversationId).catch(() => {});
      }
    } catch {
      // silent - the next poll just retries
    }
  }, [conversationId]);
  useInterval(pollNew, conversationId ? POLL_MS : null);

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  const loadOlder = async () => {
    if (!hasMore || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0];
      const { data } = await getMessages(conversationId, { limit: 30, before: oldest._id });
      const el = listRef.current;
      const prevHeight = el?.scrollHeight || 0;
      data.data.messages.forEach((m) => knownIds.current.add(m._id));
      setMessages((prev) => [...data.data.messages, ...prev]);
      setHasMore(data.data.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch {
      toast.error('Failed to load older messages');
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSend = async ({ text, images }) => {
    setSending(true);
    setUploadProgress(images.length > 0 ? 0 : null);
    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      images.forEach((file) => formData.append('images', file));

      const { data } = await sendMessage(conversationId, formData, (evt) => {
        if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      knownIds.current.add(data.data.message._id);
      setMessages((prev) => [...prev, data.data.message]);
      isNearBottomRef.current = true;
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Unable to send message. Please check your connection and try again.'
      );
    } finally {
      setSending(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-canvas">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-ink-soft hover:text-ink p-1 -ml-1" aria-label="Back to conversations">
            <FiArrowLeft size={18} />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink truncate">{title}</h2>
          {subtitle && <p className="text-xs text-ink-faint truncate">{subtitle}</p>}
        </div>
      </div>

      <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <SkeletonRows count={4} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <FiAlertCircle className="text-rose-500" size={24} />
            <p className="text-sm text-ink">{error}</p>
            <Button size="sm" onClick={fetchInitial}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-2">
                <Button variant="secondary" size="sm" loading={loadingOlder} onClick={loadOlder}>
                  Load older messages
                </Button>
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m._id} message={m} isOwn={m.senderId === currentUserId} onImageClick={setLightboxSrc} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <ChatComposer onSend={handleSend} sending={sending} uploadProgress={uploadProgress} initialText={initialText} />
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
};

export default ChatWindow;
