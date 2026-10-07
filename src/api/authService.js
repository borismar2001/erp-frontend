import api from './axios';

export const login = async (username, password) => {
  // Ajusta la URL según tu backend (ej. /auth/login o /login)
  const response = await api.post('/auth/login', { username, password });
  
  // Si el backend devuelve el token, lo guardamos
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/auth/login';
};