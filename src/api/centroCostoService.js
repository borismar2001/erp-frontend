import api from './axios';

export const getCentrosCosto = () => api.get('/api/v1/centro-costo');
export const getCentroCostoById = (id) => api.get(`/api/v1/centro-costo/${id}`);
export const createCentroCosto = (data) => api.post('/api/v1/centro-costo', data);
export const updateCentroCosto = (id, data) => api.put(`/api/v1/centro-costo/${id}`, data);
export const deleteCentroCosto = (id) => api.delete(`/api/v1/centro-costo/${id}`);