import api from './api';

export const createInventoryItem = (payload) => api.post('/inventory', payload);
export const getInventoryItems = (params) => api.get('/inventory', { params });
export const getInventoryStats = () => api.get('/inventory/stats/summary');
