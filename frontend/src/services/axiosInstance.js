import axios from 'axios';

// Common API URL configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create and export a configured axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

export default axiosInstance;