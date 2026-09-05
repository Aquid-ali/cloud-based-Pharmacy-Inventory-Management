import api from './api';

export const createOrGetConversation = (pharmacyId) => api.post('/conversations', { pharmacyId });
export const getCustomerConversations = () => api.get('/conversations/customer');
export const getPharmacyConversations = () => api.get('/conversations/pharmacy');
export const getUnreadCount = () => api.get('/conversations/unread-count');
export const getMessages = (conversationId, params) =>
  api.get(`/conversations/${conversationId}/messages`, { params });
export const sendMessage = (conversationId, formData, onUploadProgress) =>
  api.post(`/conversations/${conversationId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
export const markConversationRead = (conversationId) => api.patch(`/conversations/${conversationId}/read`);

// A plain <img src> can't attach the Authorization header, so attachment
// URLs carry the JWT as a query param instead (verified server-side against
// the specific conversation - see conversationController.getAttachment).
export const getAttachmentUrl = (relativeUrl) => {
  const token = localStorage.getItem('medichain_token');
  const base = api.defaults.baseURL.replace(/\/api\/?$/, '');
  return `${base}${relativeUrl}?token=${encodeURIComponent(token || '')}`;
};

/**
 * Shared "Message Pharmacy" action - redirects to login (preserving the
 * return path) if signed out, otherwise finds/creates the conversation and
 * navigates straight into it. `prefillText` carries medicine-context (e.g.
 * "I'm asking about: Paracetamol 500mg.") into the chat as a draft.
 */
export const startConversation = async (pharmacyId, { navigate, user, currentPath, prefillText } = {}) => {
  if (!user) {
    navigate('/login', { state: { from: { pathname: currentPath || window.location.pathname } } });
    return;
  }
  const { data } = await createOrGetConversation(pharmacyId);
  const conversationId = data.data.conversation._id;
  navigate(`/shop/messages/${conversationId}`, { state: { prefillText } });
};
