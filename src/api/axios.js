import axios from 'axios';

const api = axios.create({
  baseURL: '/', 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

// Interceptor para manejar el token CSRF
api.interceptors.request.use(config => {
  const token = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token.split('=')[1]);
  }
  return config;
});

// Interceptor de respuesta para detectar HTML inesperado (Blade views)
api.interceptors.response.use(response => {
  // Si el backend devuelve HTML en lugar de JSON, marcamos la respuesta
  if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
    console.warn("Detección: El backend devolvió una vista Blade (HTML) en lugar de datos API (JSON).");
    response.isHtml = true;
  }
  return response;
}, error => {
  return Promise.reject(error);
});

export default api;
