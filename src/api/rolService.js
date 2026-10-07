import api from './axios';

export const getRoles = () => api.get('/api/v1/roles');
export const getRolById = (id) => api.get(`/api/v1/roles/${id}`);
export const createRol = (data) => api.post('/api/v1/roles', data);
export const updateRol = (id, data) => api.put(`/api/v1/roles/${id}`, data);
export const deleteRol = (id) => api.delete(`/api/v1/roles/${id}`);