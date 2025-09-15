import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: '/api'
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 and token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token available');

        const response = await axios.post('/api/auth/refresh', { token });
        const newToken = response.data?.data?.token;

        if (newToken) {
          localStorage.setItem('token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('tenant');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Show error toast
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    if (message) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
