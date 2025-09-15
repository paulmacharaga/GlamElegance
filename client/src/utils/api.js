import axios from 'axios';

// Determine base URL for API calls
const getBaseURL = () => {
  // Debug logging
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    hostname: window.location.hostname,
    origin: window.location.origin
  });

  // Check for explicit environment variable first
  if (process.env.REACT_APP_API_URL) {
    console.log('Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // Force production URL if on vercel domain
  if (window.location.hostname.includes('vercel.app')) {
    const baseURL = window.location.origin;
    console.log('Vercel domain detected - using same origin:', baseURL);
    return baseURL;
  }

  // In production, use same domain
  if (process.env.NODE_ENV === 'production') {
    const baseURL = window.location.origin;
    console.log('Production mode - using same origin:', baseURL);
    return baseURL;
  }

  // Development mode
  console.log('Development mode - using localhost:5001');
  return 'http://localhost:5001';
};

// Create axios instance with proper configuration
const baseURL = getBaseURL();
console.log('Final base URL for axios:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 second timeout for serverless functions
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Explicitly set credentials handling
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Debug logging
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
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
