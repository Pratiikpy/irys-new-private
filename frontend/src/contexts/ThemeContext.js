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
  const [isLoaded, setIsLoaded] = useState(false);

  // Theme definitions
  const themes = {
    dark: {
      name: 'Dark Mode',
      colors: {
        // Background colors
        'bg-primary': '#0a0a0b',
        'bg-secondary': '#1a1a1b',
        'bg-tertiary': '#272729',
        'bg-hover': '#343536',
        'bg-card': '#1e1e1f',
        'bg-input': '#2d2d2e',
        'bg-overlay': 'rgba(0, 0, 0, 0.8)',
        
        // Text colors
        'text-primary': '#d7dadc',
        'text-secondary': '#818384',
        'text-muted': '#565758',
        'text-link': '#4fbcff',
        
        // Accent colors
        'accent-primary': '#ff4500',
        'accent-secondary': '#0079d3',
        'accent-success': '#46d160',
        'accent-warning': '#ffd635',
        'accent-danger': '#ea0027',
        'accent-upvote': '#ff8b60',
        'accent-downvote': '#9494ff',
        
        // Irys brand colors
        'irys-green': '#00ff88',
        'irys-blue': '#00d1ff',
        'irys-glow': 'rgba(0, 255, 136, 0.4)',
        
        // Borders
        'border-primary': '#343536',
        'border-secondary': '#4a4a4b',
        'border-glass': 'rgba(255, 255, 255, 0.1)',
        
        // Shadows
        'shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.6)',
        'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.8)',
        'shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.9)',
        'shadow-glow': '0 0 20px rgba(0, 255, 136, 0.4)',
      }
    },
    light: {
      name: 'Light Mode',
      colors: {
        // Background colors
        'bg-primary': '#ffffff',
        'bg-secondary': '#f6f7f8',
        'bg-tertiary': '#e4e6e7',
        'bg-hover': '#d7dadc',
        'bg-card': '#ffffff',
        'bg-input': '#f6f7f8',
        'bg-overlay': 'rgba(0, 0, 0, 0.5)',
        
        // Text colors
        'text-primary': '#1c1c1c',
        'text-secondary': '#576069',
        'text-muted': '#7c7f82',
        'text-link': '#0079d3',
        
        // Accent colors
        'accent-primary': '#ff4500',
        'accent-secondary': '#0079d3',
        'accent-success': '#46d160',
        'accent-warning': '#ffd635',
        'accent-danger': '#ea0027',
        'accent-upvote': '#ff8b60',
        'accent-downvote': '#9494ff',
        
        // Irys brand colors
        'irys-green': '#00ff88',
        'irys-blue': '#00d1ff',
        'irys-glow': 'rgba(0, 255, 136, 0.4)',
        
        // Borders
        'border-primary': '#ccc',
        'border-secondary': '#999',
        'border-glass': 'rgba(0, 0, 0, 0.1)',
        
        // Shadows
        'shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.16)',
        'shadow-glow': '0 0 20px rgba(0, 255, 136, 0.3)',
      }
    },
    midnight: {
      name: 'Midnight Blue',
      colors: {
        // Background colors
        'bg-primary': '#0a0e1a',
        'bg-secondary': '#1a1f2e',
        'bg-tertiary': '#2a2f3e',
        'bg-hover': '#3a3f4e',
        'bg-card': '#1e2332',
        'bg-input': '#2d3241',
        'bg-overlay': 'rgba(10, 14, 26, 0.9)',
        
        // Text colors
        'text-primary': '#e8eaff',
        'text-secondary': '#a0a4b8',
        'text-muted': '#6a6f85',
        'text-link': '#4fbcff',
        
        // Accent colors
        'accent-primary': '#ff6b6b',
        'accent-secondary': '#4ecdc4',
        'accent-success': '#45b7d1',
        'accent-warning': '#f9ca24',
        'accent-danger': '#e74c3c',
        'accent-upvote': '#ff8b60',
        'accent-downvote': '#9494ff',
        
        // Irys brand colors
        'irys-green': '#00ff88',
        'irys-blue': '#00d1ff',
        'irys-glow': 'rgba(0, 255, 136, 0.4)',
        
        // Borders
        'border-primary': '#2a2f3e',
        'border-secondary': '#3a3f4e',
        'border-glass': 'rgba(255, 255, 255, 0.1)',
        
        // Shadows
        'shadow-sm': '0 2px 4px rgba(10, 14, 26, 0.6)',
        'shadow-md': '0 4px 12px rgba(10, 14, 26, 0.8)',
        'shadow-lg': '0 8px 24px rgba(10, 14, 26, 0.9)',
        'shadow-glow': '0 0 20px rgba(0, 255, 136, 0.4)',
      }
    },
    oled: {
      name: 'OLED Black',
      colors: {
        // Background colors
        'bg-primary': '#000000',
        'bg-secondary': '#0a0a0a',
        'bg-tertiary': '#1a1a1a',
        'bg-hover': '#2a2a2a',
        'bg-card': '#0f0f0f',
        'bg-input': '#1a1a1a',
        'bg-overlay': 'rgba(0, 0, 0, 0.9)',
        
        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0a0',
        'text-muted': '#666666',
        'text-link': '#4fbcff',
        
        // Accent colors
        'accent-primary': '#ff4500',
        'accent-secondary': '#0079d3',
        'accent-success': '#46d160',
        'accent-warning': '#ffd635',
        'accent-danger': '#ea0027',
        'accent-upvote': '#ff8b60',
        'accent-downvote': '#9494ff',
        
        // Irys brand colors
        'irys-green': '#00ff88',
        'irys-blue': '#00d1ff',
        'irys-glow': 'rgba(0, 255, 136, 0.4)',
        
        // Borders
        'border-primary': '#1a1a1a',
        'border-secondary': '#2a2a2a',
        'border-glass': 'rgba(255, 255, 255, 0.05)',
        
        // Shadows
        'shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.8)',
        'shadow-md': '0 4px 12px rgba(0, 0, 0, 0.9)',
        'shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.95)',
        'shadow-glow': '0 0 20px rgba(0, 255, 136, 0.4)',
      }
    }
  };

  // Apply theme to CSS variables
  const applyTheme = (themeName) => {
    const themeColors = themes[themeName].colors;
    const root = document.documentElement;
    
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    // Set theme attribute for additional styling
    root.setAttribute('data-theme', themeName);
  };

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('irys-theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
    setIsLoaded(true);
  }, []);

  // Update theme
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('irys-theme', newTheme);
  };

  const value = {
    theme,
    themes,
    changeTheme,
    isLoaded,
    currentTheme: themes[theme]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};