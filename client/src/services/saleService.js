import api from './api';

export const createSale = (payload) => api.post('/sales', payload);
export const getSales = (params) => api.get('/sales', { params });
export const getSalesStats = () => api.get('/sales/stats/summary');
