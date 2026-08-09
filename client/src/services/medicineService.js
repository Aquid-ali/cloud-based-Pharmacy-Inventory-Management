import api from './api';

export const getMedicines = (params) => api.get('/medicines', { params });
export const getMedicineById = (id) => api.get(`/medicines/${id}`);
export const createMedicine = (payload) => api.post('/medicines', payload);
export const updateMedicine = (id, payload) => api.put(`/medicines/${id}`, payload);
export const deleteMedicine = (id) => api.delete(`/medicines/${id}`);
export const getDashboardStats = () => api.get('/medicines/stats/summary');
