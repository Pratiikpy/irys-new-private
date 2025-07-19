import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  Moon, 
  Sun, 
  Palette,
  ChevronDown,
  User,
  LogOut,
  Bookmark,
  Shield
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Header = ({ currentUser, onLogin, onLogout, onSettings }) => {
  const { theme, themes, changeTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const themeMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const getThemeIcon = (themeName) => {
    switch (themeName) {
      case 'dark':
        return <Moon size={16} />;
      case 'light':
        return <Sun size={16} />;
      case 'midnight':
        return <Palette size={16} />;
      case 'oled':
        return <Moon size={16} />;
      default:
        return <Moon size={16} />;
    }
  };

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <div className="header-left">
          <div className="logo-container">
            <div className="logo">
              <span className="logo-text">Irys</span>
              <span className="logo-subtitle">Confessions</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="header-center">
          <form onSubmit={handleSearch} className="search-container">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search confessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="header-right">
          {/* Theme Switcher */}
          <div className="theme-switcher" ref={themeMenuRef}>
            <button
              className="theme-button"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title="Change theme"
            >
              {getThemeIcon(theme)}
              <ChevronDown size={14} />
            </button>
            
            {showThemeMenu && (
              <div className="theme-dropdown">
                {Object.entries(themes).map(([key, themeData]) => (
                  <button
                    key={key}
                    className={`theme-option ${theme === key ? 'active' : ''}`}
                    onClick={() => {
                      changeTheme(key);
                      setShowThemeMenu(false);
                    }}
                  >
                    {getThemeIcon(key)}
                    <span>{themeData.name}</span>
                    {theme === key && <div className="theme-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="header-button" title="Notifications">
            <Bell size={20} />
          </button>

          {/* User Menu */}
          <div className="user-menu" ref={userMenuRef}>
            {currentUser ? (
              <>
                <button
                  className="user-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                  </div>
                  <ChevronDown size={14} />
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <div className="user-avatar-large">
                        {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                      </div>
                      <div className="user-details">
                        <span className="username">{currentUser.username || 'Anonymous'}</span>
                        <span className="user-status">Connected to Irys</span>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider" />
                    
                    <button className="dropdown-item">
                      <User size={16} />
                      <span>Profile</span>
                    </button>
                    
                    <button className="dropdown-item">
                      <Bookmark size={16} />
                      <span>Saved Posts</span>
                    </button>
                    
                    <button className="dropdown-item">
                      <Shield size={16} />
                      <span>Blockchain Status</span>
                    </button>
                    
                    <div className="dropdown-divider" />
                    
                    <button className="dropdown-item" onClick={onSettings}>
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    
                    <button className="dropdown-item" onClick={onLogout}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button className="login-button" onClick={onLogin}>
                <User size={16} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;