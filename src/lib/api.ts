import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Bearer token fallback
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for unauthorized handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isLoginPath = window.location.pathname === '/login';
      if (!isLoginPath) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        // Do not force redirect if already on login or landing
      }
    }
    return Promise.reject(error);
  }
);

export default api;
