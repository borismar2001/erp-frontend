import api from './axios';

export const getSucursales = () => api.get('/api/v1/sucursal');
export const getSucursalById = (id) => api.get(`/api/v1/sucursal/${id}`);
export const createSucursal = (data) => api.post('/api/v1/sucursal', data);
export const updateSucursal = (id, data) => api.put(`/api/v1/sucursal/${id}`, data);
export const deleteSucursal = (id) => api.delete(`/api/v1/sucursal/${id}`);