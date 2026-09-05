import axios from 'axios';
import { triggerGlobalNotification } from '../context/NotificationContext';

const PROD_API_GATEWAY_URL = 'https://95t7w0g5nd.execute-api.ap-south-1.amazonaws.com/production';

// Safely access environment variables, checking both React (process.env) and Vite (import.meta.env) context
const getBaseURL = () => {
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ADMIN_API_GATEWAY_URL) {
    return process.env.REACT_APP_ADMIN_API_GATEWAY_URL;
  }
  if (import.meta && import.meta.env && import.meta.env.VITE_ADMIN_API_GATEWAY_URL) {
    return import.meta.env.VITE_ADMIN_API_GATEWAY_URL;
  }
  // If running in browser and hostname is not localhost/127.0.0.1, use AWS API Gateway
  if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return PROD_API_GATEWAY_URL;
  }
  return 'http://localhost:5000'; // Local dev fallback
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
    const url = error.config?.url || '';
    
    // Check if error is 401 unauthorized
    if (status === 401) {
      // If token exists and is invalid, clear credentials
      if (localStorage.getItem('admin_token')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        
        triggerGlobalNotification(
          'Session expired. Redirecting to login...',
          'error'
        );
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } else if (error.config?.method !== 'get' && status && status >= 500) {
      // Only show global notification for failed mutations (POST/PUT/DELETE)
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Server error';
      triggerGlobalNotification(
        `Action Failed (${status}): ${errorMsg}`,
        'error'
      );
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
