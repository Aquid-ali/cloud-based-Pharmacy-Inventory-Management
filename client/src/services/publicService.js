import api from './api';

export const getPublicStats = () => api.get('/public/stats');
export const getPublicPharmacies = () => api.get('/public/pharmacies');
