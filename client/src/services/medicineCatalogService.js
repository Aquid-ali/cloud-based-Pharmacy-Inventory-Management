import api from './api';

// Full-field list (search/manufacturer filter + pagination), used by admin
// screens that need more than the customer-safe projection searchCatalogMedicines
// returns - e.g. enrichmentStatus/enrichmentConfidence for Medicine Data Management.
export const getCatalogMedicines = (params) => api.get('/medicine-catalog', { params });
export const searchCatalogMedicines = (params) => api.get('/medicine-catalog/search', { params });
export const getCatalogMedicineById = (id) => api.get(`/medicine-catalog/${id}`);
export const getCatalogMedicineAvailability = (id) => api.get(`/medicine-catalog/${id}/availability`);
