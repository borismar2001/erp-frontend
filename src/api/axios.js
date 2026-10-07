import axios from 'axios';

// Creamos la instancia centralizada
const api = axios.create({
  baseURL: 'http://localhost:8080', // Cambia esto por la URL de tu Spring Boot o Node
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor: Antes de cada petición, revisamos si hay un token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);




export default api;