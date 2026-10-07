import api from './axios';

export const getPerfiles = () => api.get('/api/perfil');
export const getPerfilById = (id) => api.get(`/api/perfil/${id}`);
export const createPerfil = (data) => api.post('/api/perfil', data);
export const updatePerfil = (id, data) => api.put(`/api/perfil/${id}`, data);
export const deletePerfil = (id) => api.delete(`/api/perfil/${id}`);