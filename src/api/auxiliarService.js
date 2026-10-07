import api from './axios';

export const getAuxiliares = () => api.get('/api/v1/auxiliar');
export const getAuxiliarById = (id) => api.get(`/api/v1/auxiliar/${id}`);
export const createAuxiliar = (data) => api.post('/api/v1/auxiliar', data);
export const updateAuxiliar = (id, data) => api.put(`/api/v1/auxiliar/${id}`, data);
export const deleteAuxiliar = (id) => api.delete(`/api/v1/auxiliar/${id}`);