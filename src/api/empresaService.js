import api from './axios';

export const getEmpresas = () => api.get('/api/v1/empresas');
export const getEmpresaById = (id) => api.get(`/api/v1/empresas/${id}`);
export const createEmpresa = (data) => api.post('/api/v1/empresas', data);
export const updateEmpresa = (id, data) => api.put(`/api/v1/empresas/${id}`, data);
export const deleteEmpresa = (id) => api.delete(`/api/v1/empresas/${id}`);