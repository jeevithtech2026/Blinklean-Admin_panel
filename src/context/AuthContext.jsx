import React, { createContext, useContext, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('admin_token');
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminUser, setAdminUser] = useState(() => {
    const savedUser = localStorage.getItem('admin_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!username.trim() || !password.trim()) {
        throw new Error('Username and password are required');
      }

      // Authenticate with the AWS Cognito backend endpoint
      const response = await axiosInstance.post('/api/v1/auth/login', {
        username: username.trim(),
        password: password,
      });

      if (response.data && response.data.token) {
        const { token, user } = response.data;

        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(user));
        
        setIsAuthenticated(true);
        setAdminUser(user);
        return true;
      } else {
        throw new Error('Invalid authentication response from server');
      }
    } catch (err) {
      let errMsg = err.response?.data?.error || err.response?.data?.message;
      if (!errMsg) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          errMsg = 'Connection timed out. The server may be waking up, please try again.';
        } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          errMsg = 'Network Error: Unable to connect to the authentication service. Please check your network connection.';
        } else {
          errMsg = err.message || 'Login failed. Please try again.';
        }
      }
      setError(errMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, error, adminUser, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
