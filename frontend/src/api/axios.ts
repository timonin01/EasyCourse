import axios from 'axios';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (userId) {
    config.headers['User-Id'] = userId;
  }
  
  return config;
});

function isAuthRequest(url?: string): boolean {
  if (!url) {
    return false;
  }

  return url.includes('/v1/users/login') || /\/v1\/users\/?$/.test(url);
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url as string | undefined;

    // Не редиректим при неудачном логине/регистрации — иначе страница перезагружается
    if (status === 401 && !isAuthRequest(requestUrl)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

