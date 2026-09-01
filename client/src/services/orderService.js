import api from './api';

export const createOrder = (payload) => api.post('/orders', payload);
export const getMyOrders = () => api.get('/orders/mine');
export const getStoreOrders = () => api.get('/orders');
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
