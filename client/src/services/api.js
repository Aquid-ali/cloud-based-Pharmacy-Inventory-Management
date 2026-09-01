import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Attach JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medichain_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login if the token is invalid/expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('medichain_token');
      localStorage.removeItem('medichain_user');
      const isAdminSection = window.location.pathname.startsWith('/dashboard') ||
        window.location.pathname.startsWith('/admin') ||
        window.location.pathname.startsWith('/medicines') ||
        window.location.pathname.startsWith('/inventory') ||
        window.location.pathname.startsWith('/sales') ||
        window.location.pathname.startsWith('/purchase') ||
        window.location.pathname.startsWith('/employees') ||
        window.location.pathname.startsWith('/reports') ||
        window.location.pathname.startsWith('/analytics') ||
        window.location.pathname.startsWith('/notifications') ||
        window.location.pathname.startsWith('/cloud') ||
        window.location.pathname.startsWith('/settings') ||
        window.location.pathname.startsWith('/customers');
      const loginPath = isAdminSection ? '/admin/login' : '/login';
      // Avoid redirect loop if already on a login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
