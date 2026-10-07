import api from './axios';

export const getUsuarios = () => api.get('/api/usuario');
export const createUsuario = (data) => api.post('/api/usuario', data);
export const updateUsuario = (id, data) => api.put(`/api/usuario/${id}`, data);
export const deleteUsuario = (id) => api.delete(`/api/usuario/${id}`);
