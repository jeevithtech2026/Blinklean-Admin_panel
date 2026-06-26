import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from '../components/ui/Toast';

const NotificationContext = createContext(null);

// Global mutable callback to permit notification triggers from non-React environments
let globalShowNotification = null;

/**
 * Fires a global notification toast outside React contexts (e.g. within Axios Interceptors).
 * @param {string} message - Message body content.
 * @param {'success'|'warning'|'error'|'info'} type - Toast alert category.
 */
export const triggerGlobalNotification = (message, type = 'info') => {
  if (globalShowNotification) {
    globalShowNotification(message, type);
  } else {
    console.warn('[NotificationContext] Global notification triggered before provider initialization:', { message, type });
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  // Sync React showNotification method with the global trigger
  useEffect(() => {
    globalShowNotification = showNotification;
    return () => {
      globalShowNotification = null;
    };
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Toast container overlay fixed to the viewport top-right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-auto">
        {notifications.map((notif) => (
          <Toast
            key={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => removeNotification(notif.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
