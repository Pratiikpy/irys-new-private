import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [crisisSupport, setCrisisSupport] = useState(true);

  useEffect(() => {
    // Load theme from localStorage or user preferences
    const savedTheme = localStorage.getItem('theme');
    const savedNotifications = localStorage.getItem('notifications');
    const savedCrisisSupport = localStorage.getItem('crisisSupport');

    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    if (savedCrisisSupport) {
      setCrisisSupport(JSON.parse(savedCrisisSupport));
    }
  }, []);

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const updateNotifications = (enabled) => {
    setNotifications(enabled);
    localStorage.setItem('notifications', JSON.stringify(enabled));
  };

  const updateCrisisSupport = (enabled) => {
    setCrisisSupport(enabled);
    localStorage.setItem('crisisSupport', JSON.stringify(enabled));
  };

  const value = {
    theme,
    notifications,
    crisisSupport,
    updateTheme,
    updateNotifications,
    updateCrisisSupport
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};