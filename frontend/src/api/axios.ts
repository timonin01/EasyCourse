import axios from 'axios';
import { API_TIMEOUT_MS } from '../config/api';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function isPublicAuthRequest(url?: string): boolean {
  if (!url) {
    return false;
  }

  return (
    url.includes('/v1/users/login') ||
    url.includes('/v1/users/registration-config') ||
    url.includes('/v1/users/verify-email') ||
    url.includes('/v1/users/resend-verification') ||
    /\/v1\/users\/?$/.test(url)
  );
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url as string | undefined;

    // Не редиректим на публичных auth-эндпоинтах (логин, регистрация, конфиг)
    if (status === 401 && !isPublicAuthRequest(requestUrl)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

