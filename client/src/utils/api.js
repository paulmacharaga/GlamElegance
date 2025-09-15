import axios from 'axios';

// Create a simple API utility that won't break the app
let api;

try {
  // Simple, reliable base URL determination
  const getBaseURL = () => {
    try {
      // Always use same origin in browser
      const baseURL = window.location.origin;
      console.log('API: Using base URL:', baseURL);
      return baseURL;
    } catch (error) {
      console.error('API: Error getting base URL:', error);
      return 'https://glam-elegance.vercel.app'; // Fallback
    }
  };

  // Create axios instance with minimal configuration
  api = axios.create({
    baseURL: getBaseURL(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Simple request interceptor
  api.interceptors.request.use(
    (config) => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      } catch (error) {
        console.error('API: Request interceptor error:', error);
        return config;
      }
    },
    (error) => {
      console.error('API: Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor with error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API: Response error:', error.message);
      return Promise.reject(error);
    }
  );

} catch (error) {
  console.error('API: Failed to initialize axios:', error);

  // Fallback API object that uses fetch
  api = {
    get: async (url, config = {}) => {
      const response = await fetch(url, { method: 'GET', ...config });
      return { data: await response.json() };
    },
    post: async (url, data, config = {}) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...config.headers },
        body: JSON.stringify(data),
        ...config
      });
      return { data: await response.json() };
    },
    put: async (url, data, config = {}) => {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...config.headers },
        body: JSON.stringify(data),
        ...config
      });
      return { data: await response.json() };
    },
    delete: async (url, config = {}) => {
      const response = await fetch(url, { method: 'DELETE', ...config });
      return { data: await response.json() };
    }
  };
}

export default api;
