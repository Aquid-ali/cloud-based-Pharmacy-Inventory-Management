import api from './api';

export const getPharmacies = (params) => api.get('/pharmacies', { params });
export const getPharmacyById = (id) => api.get(`/pharmacies/${id}`);
export const updatePharmacy = (id, payload) => api.put(`/pharmacies/${id}`, payload);
export const getNearbyPharmacies = (lat, lng, limit) =>
  api.get('/pharmacies/nearby', { params: { lat, lng, limit } });
export const browsePharmacyInventory = (params) => api.get('/pharmacies/browse-inventory', { params });
