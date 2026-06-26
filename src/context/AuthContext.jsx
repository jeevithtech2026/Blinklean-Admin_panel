import React, { createContext, useContext, useState } from 'react';

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
      // Simulate network request latency for real UI experience
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (!username.trim() || !password.trim()) {
        throw new Error('Username and password are required');
      }

      if (username.trim() !== 'admin' || password.trim() !== 'password123') {
        throw new Error('Invalid username or password (Hint: admin / password123)');
      }

      // Generate a mock token and store standard details
      const mockToken = 'mock_admin_token_' + Math.random().toString(36).substring(2);
      const user = { username: username.trim(), role: 'Super Admin' };

      localStorage.setItem('admin_token', mockToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
      
      setIsAuthenticated(true);
      setAdminUser(user);
      return true;
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
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
