import axios from 'axios';

const getBaseUrl = (): string => {
  // When executing server-side (RSC / Server Actions / Route Handlers), use Vercel service binding
  if (typeof window === 'undefined' && process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL}/api`;
  }
  // When executing in browser or local dev, use environment variable or same-domain relative path
  return process.env.NEXT_PUBLIC_API_URL || '/api';
};

const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('iris_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle 401 token refresh or redirection
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('iris_refresh_token');
          if (refreshToken) {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
            const newToken = res.data?.data?.accessToken;
            if (newToken) {
              localStorage.setItem('iris_access_token', newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          }
        }
      } catch (refreshErr) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('iris_access_token');
          localStorage.removeItem('iris_refresh_token');
          localStorage.removeItem('iris_user');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
