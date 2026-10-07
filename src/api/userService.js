import api from '../axios';

export const getUsers = () => api.get('/api/usuario');
export const createUser = (data) => api.post('/api/usuario', data);
export const updateUser = (id, data) => api.put(`/api/usuario/${id}`, data);
export const deleteUser = (id) => api.delete(`/api/usuario/${id}`);

