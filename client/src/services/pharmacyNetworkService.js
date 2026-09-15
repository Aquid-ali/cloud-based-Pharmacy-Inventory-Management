import api from './api';

export const discoverPharmacies = (params) => api.get('/pharmacy-network/pharmacies', { params });
export const getPharmacyProfile = (id) => api.get(`/pharmacy-network/pharmacies/${id}`);

export const sendConnectionRequest = (pharmacyId) => api.post('/pharmacy-network/connections', { pharmacyId });
export const getMyConnections = (params) => api.get('/pharmacy-network/connections', { params });
export const acceptConnectionRequest = (id) => api.patch(`/pharmacy-network/connections/${id}/accept`);
export const declineConnectionRequest = (id) => api.patch(`/pharmacy-network/connections/${id}/decline`);
export const cancelConnectionRequest = (id) => api.delete(`/pharmacy-network/connections/${id}`);
export const blockConnection = (id) => api.patch(`/pharmacy-network/connections/${id}/block`);
export const unblockConnection = (id) => api.patch(`/pharmacy-network/connections/${id}/unblock`);

export const getMyPharmacyConversations = () => api.get('/pharmacy-network/conversations');
export const getPharmacyNetworkUnreadSummary = () => api.get('/pharmacy-network/unread-count');
export const getPharmacyMessages = (conversationId, params) =>
  api.get(`/pharmacy-network/conversations/${conversationId}/messages`, { params });
export const sendPharmacyMessage = (conversationId, formData, onUploadProgress) =>
  api.post(`/pharmacy-network/conversations/${conversationId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
export const sendProductRequestMessage = (conversationId, productRequest) =>
  api.post(`/pharmacy-network/conversations/${conversationId}/messages`, { productRequest });
export const markPharmacyConversationRead = (conversationId) =>
  api.patch(`/pharmacy-network/conversations/${conversationId}/read`);
export const deletePharmacyMessage = (conversationId, messageId) =>
  api.delete(`/pharmacy-network/conversations/${conversationId}/messages/${messageId}`);

// A plain <img src> can't attach the Authorization header, so attachment
// URLs carry the JWT as a query param instead (verified server-side against
// the specific conversation - see pharmacyChatController.getAttachment).
export const getPharmacyAttachmentUrl = (relativeUrl) => {
  const token = localStorage.getItem('medichain_token');
  const base = api.defaults.baseURL.replace(/\/api\/?$/, '');
  return `${base}${relativeUrl}?token=${encodeURIComponent(token || '')}`;
};
