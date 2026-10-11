import api from './api';

export const getPharmacies = (params) => api.get('/pharmacies', { params });
export const getPharmacyById = (id) => api.get(`/pharmacies/${id}`);
export const updatePharmacy = (id, payload) => api.put(`/pharmacies/${id}`, payload);
export const getNearbyPharmacies = (lat, lng, limit) =>
  api.get('/pharmacies/nearby', { params: { lat, lng, limit } });
export const browsePharmacyInventory = (params) => api.get('/pharmacies/browse-inventory', { params });

// UPI QR Code management
export const uploadUpiQrCode = (pharmacyId, file) => {
  const formData = new FormData();
  formData.append('qrCode', file);
  return api.post(`/pharmacies/${pharmacyId}/qr-code`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteUpiQrCode = (pharmacyId) => api.delete(`/pharmacies/${pharmacyId}/qr-code`);
export const getPharmacyQrCode = (pharmacyId) => api.get(`/pharmacies/${pharmacyId}/qr-code`);

