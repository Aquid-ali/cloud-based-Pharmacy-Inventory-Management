import api from './api';

export const getStores = () => api.get('/stores');
export const getNearbyStores = (lat, lng, limit) =>
  api.get('/stores/nearby', { params: { lat, lng, limit } });
