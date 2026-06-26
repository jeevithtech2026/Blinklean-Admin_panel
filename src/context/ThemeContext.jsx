import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Force light mode based on user preference
    localStorage.setItem('admin_theme', 'light');
    return 'light';
  });

  const [density, setDensity] = useState(() => {
    const savedDensity = localStorage.getItem('admin_density');
    return savedDensity === 'compact' || savedDensity === 'comfortable' ? savedDensity : 'comfortable';
  });

  // Apply dark mode styling class to root document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('admin_theme', theme);
  }, [theme]);

  // Sync density value to local storage
  useEffect(() => {
    localStorage.setItem('admin_density', density);
  }, [density]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
