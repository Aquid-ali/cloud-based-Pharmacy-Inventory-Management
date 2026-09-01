import api from './api';

export const enrichMedicine = (id, force = false) => api.post(`/medicine-catalog/${id}/enrich`, { force });
export const enrichAllMedicines = () => api.post('/medicine-catalog/enrich-all');
export const retryFailedMedicines = () => api.post('/medicine-catalog/retry-failed');
export const getEnrichmentStats = () => api.get('/medicine-catalog/enrichment-stats');
export const getNeedsReview = (params) => api.get('/medicine-catalog/needs-review', { params });
export const approveReview = (id) => api.post(`/medicine-catalog/${id}/review/approve`);
export const updateMedicineNameAndRetry = (id, name) => api.patch(`/medicine-catalog/${id}/review/name`, { name });
