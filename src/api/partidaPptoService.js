import api from './axios';

export const getPartidasPpto = () => api.get('/api/v1/partida-ppto');
export const getPartidaPptoById = (id) => api.get(`/api/v1/partida-ppto/${id}`);
export const createPartidaPpto = (data) => api.post('/api/v1/partida-ppto', data);
export const updatePartidaPpto = (id, data) => api.put(`/api/v1/partida-ppto/${id}`, data);
export const deletePartidaPpto = (id) => api.delete(`/api/v1/partida-ppto/${id}`);