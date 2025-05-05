import axios from 'axios';

// Common API URL configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create and export a configured axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include authentication token
axiosInstance.interceptors.request.use(
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

// Add response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized errors globally
      if (error.response.status === 401) {
        // You could dispatch a logout action or redirect to login
        console.warn('Authentication error detected');
      }
      
      // Handle 500 server errors
      if (error.response.status >= 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error - no response received');
    } else {
      // Something happened in setting up the request
      console.error('Request configuration error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;