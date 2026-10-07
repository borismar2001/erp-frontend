import api from './axios';

export const getPersonas = () => api.get('/api/v1/personas');
export const createPersona = (data) => api.post('/api/v1/personas', data);
export const updatePersona = (id, data) => api.put(`/api/v1/personas/${id}`, data);
export const deletePersona = (id) => api.delete(`/api/v1/personas/${id}`);