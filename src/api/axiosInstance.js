import axios from 'axios';
import { triggerGlobalNotification } from '../context/NotificationContext';

// Safely access environment variables, checking both React (process.env) and Vite (import.meta.env) context
const getBaseURL = () => {
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ADMIN_API_GATEWAY_URL) {
    return process.env.REACT_APP_ADMIN_API_GATEWAY_URL;
  }
  if (import.meta && import.meta.env && import.meta.env.VITE_ADMIN_API_GATEWAY_URL) {
    return import.meta.env.VITE_ADMIN_API_GATEWAY_URL;
  }
  return 'http://localhost:5000'; // Local fallback
};

const baseURL = getBaseURL();

console.log(`[API Config] axios base URL initialized to: ${baseURL}`);

const axiosInstance = axios.create({
  baseURL,
  timeout: 15000, // Reasonable timeout threshold
});

// Request Interceptor: Inject bearer authorization token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Console telemetry for local execution
    console.log(`[API Request] ${config.method.toUpperCase()} -> ${config.url}`, {
      params: config.params,
      headers: config.headers,
    });
    
    return config;
  },
  (error) => {
    console.error('[API Request Intercept Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: telemetry, debugging, and global error notification toast
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} <- ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(
      `[API Response Error] ${error.response?.status || 'Network Error'} <- ${error.config?.url}`,
      error.message
    );
    
    const status = error.response?.status;
    // Check if error is a network connection failure or fits a 4xx/5xx gateway response
    if (!status || (status >= 400 && status < 600)) {
      const errorMsg = error.response?.data?.message || error.message || 'Connection refused';
      triggerGlobalNotification(
        `API Failure (${status || 'Network Connection Error'}): ${errorMsg}. Please verify your AWS API Gateway/Lambda gateway connectivity.`,
        'error'
      );
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
