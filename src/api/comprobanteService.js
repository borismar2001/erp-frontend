import api from './axios';

export const getComprobantes = () => api.get('/api/v1/comprobante');
export const getComprobanteById = (id) => api.get(`/api/v1/comprobante/${id}`);
export const createComprobante = (data) => api.post('/api/v1/comprobante', data);
export const updateComprobante = (id, data) => api.put(`/api/v1/comprobante/${id}`, data);
export const deleteComprobante = (id) => api.delete(`/api/v1/comprobante/${id}`);
export const activarComprobante = (id, data) => api.put(`/api/v1/comprobante/${id}/activar`, data);