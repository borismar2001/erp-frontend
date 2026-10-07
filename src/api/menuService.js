import api from './axios';

// Pasamos el idUsuario como argumento para construir la URL dinámica
export const getMenuByUsuario = (idUsuario) => {
  if (!idUsuario) {
    console.warn("getMenuByUsuario fue llamado sin un ID de usuario válido");
    return Promise.resolve({ data: [] });
  }
  return api.get(`/api/usuario/${idUsuario}/menus`);
};

export const getUserByAlias = (alias) => api.get(`/api/usuario/alias/${alias}`);
export const getMenus = () => api.get('/api/menu');
export const createMenu = (data) => api.post('/api/menu', data);
export const updateMenu = (id, data) => api.put(`/api/menu/${id}`, data);
export const deleteMenu = (id) => api.delete(`/api/menu/${id}`);