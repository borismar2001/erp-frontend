import api from './axios';

export const getTiposCambio = () => api.get('/api/v1/tipo-cambio');
export const getTipoCambioById = (id) => api.get(`/api/v1/tipo-cambio/${id}`);
export const createTipoCambio = (data) => api.post('/api/v1/tipo-cambio', data);
export const updateTipoCambio = (id, data) => api.put(`/api/v1/tipo-cambio/${id}`, data);
export const deleteTipoCambio = (id) => api.delete(`/api/v1/tipo-cambio/${id}`);