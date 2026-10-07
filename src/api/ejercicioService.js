import api from './axios';

export const getEjercicios = () => api.get('/api/v1/ejercicio');
export const getEjercicioById = (id) => api.get(`/api/v1/ejercicio/${id}`);
export const createEjercicio = (data) => api.post('/api/v1/ejercicio', data);
export const updateEjercicio = (id, data) => api.put(`/api/v1/ejercicio/${id}`, data);
export const deleteEjercicio = (id) => api.delete(`/api/v1/ejercicio/${id}`);