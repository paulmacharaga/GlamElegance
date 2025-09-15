import axios from 'axios';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (
    process.env.NODE_ENV === 'production' 
      ? window.location.origin  // Use same domain in production
      : 'http://localhost:5001'  // Use localhost in development
  ),
  timeout: 30000, // 30 second timeout for serverless functions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin';
    }
    
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

export default api;
