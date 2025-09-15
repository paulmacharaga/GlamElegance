import axios from 'axios';

// Simple, reliable base URL determination
const getBaseURL = () => {
  try {
    // Always use same origin in browser
    const baseURL = window.location.origin;
    console.log('Using base URL:', baseURL);
    return baseURL;
  } catch (error) {
    console.error('Error getting base URL:', error);
    return '';
  }
};

// Create axios instance with minimal configuration
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
