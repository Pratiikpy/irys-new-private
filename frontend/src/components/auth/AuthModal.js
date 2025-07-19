import React, { useState } from 'react';
import { 
  User, Lock, Mail, Eye, EyeOff, Sparkles, Shield, 
  ArrowRight, X, AlertCircle, CheckCircle, Wallet 
} from 'lucide-react';
import WalletConnect from './WalletConnect';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('wallet'); // 'wallet', 'login', or 'register'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  const API = `${BACKEND_URL}/api`;

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setWalletData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleWalletConnect = (walletInfo) => {
    if (walletInfo) {
      setWalletData(walletInfo);
      // Auto-success for wallet connection
      localStorage.setItem('user', JSON.stringify({
        walletAddress: walletInfo.address,
        walletSignature: walletInfo.signature,
        network: walletInfo.network,
        chainId: walletInfo.chainId,
        authType: 'wallet'
      }));
      
      showNotification('🎉 Wallet connected! You can now post anonymous confessions.', 'success');
      onSuccess({ user: { walletAddress: walletInfo.address }, authType: 'wallet' });
      handleClose();
    }
  };

  const handleWalletError = (error) => {
    console.error('Wallet error:', error);
    // Don't close modal on wallet error, let user try again
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (mode === 'register' && (formData.username.length < 3 || formData.username.length > 20)) {
      newErrors.username = 'Username must be between 3 and 20 characters';
    } else if (mode === 'register' && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (mode === 'register' && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (mode === 'register' && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      let response;
      
      if (mode === 'login') {
        response = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          })
        });
      } else {
        response = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email || undefined,
            password: formData.password
          })
        });
      }

      const data = await response.json();

      if (response.ok) {
        // Store user data and token
        localStorage.setItem('user', JSON.stringify({
          ...data.user,
          token: data.access_token
        }));
        
        showNotification(
          mode === 'login' 
            ? 'Welcome back! Successfully signed in.' 
            : '🎉 Account created successfully! Welcome to Irys Confessions!',
          'success'
        );
        
        onSuccess(data);
        handleClose();
      } else {
        setErrors({ general: data.detail || 'An error occurred' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-modal-title">
            <Sparkles size={24} />
            <h2>{mode === 'login' ? 'Welcome Back' : 'Join Irys Confessions'}</h2>
          </div>
          <button onClick={handleClose} className="auth-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="auth-modal-content">
          <div className="auth-description">
            <p>
              {mode === 'wallet' 
                ? 'Connect your wallet for anonymous blockchain verification'
                : mode === 'login' 
                ? 'Sign in to access your account and manage your confessions'
                : 'Create an account to start sharing anonymous confessions on the blockchain'
              }
            </p>
          </div>

          {errors.general && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{errors.general}</span>
            </div>
          )}

          {mode === 'wallet' ? (
            <WalletConnect 
              onConnect={handleWalletConnect}
              onError={handleWalletError}
            />
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <User size={16} />
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="Enter your username"
                autoComplete="username"
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail size={16} />
                  Email (optional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <Lock size={16} />
                Password
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  <Lock size={16} />
                  Confirm Password
                </label>
                <div className="password-input-container">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-options">
            {mode === 'wallet' ? (
              <>
                <button 
                  onClick={() => handleModeChange('login')}
                  className="auth-option-btn"
                >
                  <User size={16} />
                  Sign in with Username
                </button>
                <button 
                  onClick={() => handleModeChange('register')}
                  className="auth-option-btn"
                >
                  <Mail size={16} />
                  Create Account
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleModeChange('wallet')}
                className="auth-option-btn"
              >
                <Wallet size={16} />
                Connect Wallet Instead
              </button>
            )}
          </div>

          <div className="auth-footer">
            <span className="auth-switch-text">
              {mode === 'wallet' 
                ? 'Prefer traditional login?' 
                : mode === 'login' 
                ? "Don't have an account?" 
                : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => {
                if (mode === 'wallet') {
                  handleModeChange('login');
                } else if (mode === 'login') {
                  handleModeChange('register');
                } else {
                  handleModeChange('login');
                }
              }}
              className="auth-switch-btn"
            >
              {mode === 'wallet' 
                ? 'Sign in with Username' 
                : mode === 'login' 
                ? 'Create Account' 
                : 'Sign In'}
            </button>
          </div>

          <div className="auth-features">
            <div className="feature-item">
              <CheckCircle size={16} />
              <span>Permanently stored on blockchain</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={16} />
              <span>Anonymous by default</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={16} />
              <span>AI-powered content moderation</span>
            </div>
            {mode === 'wallet' && (
              <div className="feature-item">
                <CheckCircle size={16} />
                <span>Wallet signature verification</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;