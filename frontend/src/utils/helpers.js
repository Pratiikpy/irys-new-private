// Date formatting utilities
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

export const formatFullDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Text utilities
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

export const extractHashtags = (text) => {
  const hashtagRegex = /#(\w+)/g;
  return text.match(hashtagRegex) || [];
};

export const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  return text.match(mentionRegex) || [];
};

// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

// Content utilities
export const getMoodColor = (mood) => {
  const moodColors = {
    happy: '#fbbf24',
    sad: '#60a5fa',
    anxious: '#a78bfa',
    angry: '#f87171',
    excited: '#34d399',
    frustrated: '#fb7185',
    hopeful: '#22d3ee',
    neutral: '#6b7280'
  };
  return moodColors[mood] || moodColors.neutral;
};

export const getMoodEmoji = (mood) => {
  const moodEmojis = {
    happy: '😊',
    sad: '😢',
    anxious: '😰',
    angry: '😡',
    excited: '🎉',
    frustrated: '😤',
    hopeful: '🌟',
    neutral: '😐'
  };
  return moodEmojis[mood] || moodEmojis.neutral;
};

export const getEngagementLevel = (upvotes, replies, views) => {
  const totalEngagement = upvotes + (replies * 2) + (views * 0.1);
  
  if (totalEngagement > 100) return 'high';
  if (totalEngagement > 20) return 'medium';
  return 'low';
};

export const calculateViralScore = (confession) => {
  const { upvotes, reply_count, view_count, timestamp } = confession;
  const age = (new Date() - new Date(timestamp)) / (1000 * 60 * 60); // hours
  
  const engagementScore = upvotes + (reply_count * 2) + (view_count * 0.1);
  const timeDecay = 1 / (age + 1);
  
  return Math.round(engagementScore * timeDecay * 100) / 100;
};

// Crisis detection utilities
export const getCrisisLevel = (level) => {
  const levels = {
    none: { color: '#6b7280', label: 'None' },
    low: { color: '#fbbf24', label: 'Low' },
    medium: { color: '#f59e0b', label: 'Medium' },
    high: { color: '#ef4444', label: 'High' },
    critical: { color: '#dc2626', label: 'Critical' }
  };
  return levels[level] || levels.none;
};

export const getCrisisResources = () => {
  return {
    hotlines: [
      { name: 'National Suicide Prevention Lifeline', number: '988', available: '24/7' },
      { name: 'Crisis Text Line', number: '741741', type: 'text', available: '24/7' },
      { name: 'SAMHSA National Helpline', number: '1-800-662-4357', available: '24/7' }
    ],
    websites: [
      { name: 'Crisis Text Line', url: 'https://www.crisistextline.org' },
      { name: 'National Suicide Prevention Lifeline', url: 'https://suicidepreventionlifeline.org' },
      { name: 'SAMHSA', url: 'https://www.samhsa.gov' }
    ],
    apps: [
      { name: 'Crisis Text Line', platform: 'iOS/Android' },
      { name: 'MindShift', platform: 'iOS/Android' },
      { name: 'Sanvello', platform: 'iOS/Android' }
    ]
  };
};

// URL utilities
export const generateShareUrl = (confession) => {
  const baseUrl = window.location.origin;
  const path = confession.is_public ? 
    `/confession/${confession.tx_id}` : 
    `/confession/${confession.tx_id}?author=${confession.author}`;
  return `${baseUrl}${path}`;
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Storage utilities
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to get storage item:', error);
    return defaultValue;
  }
};

export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Failed to set storage item:', error);
    return false;
  }
};

export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to remove storage item:', error);
    return false;
  }
};

// Analytics utilities
export const trackEvent = (event, data = {}) => {
  // Analytics tracking (can be extended with Google Analytics, etc.)
  console.log('Analytics Event:', event, data);
  
  // Store locally for now
  const events = getStorageItem('analytics_events', []);
  events.push({
    event,
    data,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 1000 events
  if (events.length > 1000) {
    events.splice(0, events.length - 1000);
  }
  
  setStorageItem('analytics_events', events);
};

// Performance utilities
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Loading state utilities
export const createLoadingState = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  
  const withLoading = async (promise) => {
    setLoading(true);
    try {
      const result = await promise;
      return result;
    } finally {
      setLoading(false);
    }
  };
  
  return [loading, withLoading];
};

// Error handling utilities
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.detail || error.response.data?.message || 'Server error';
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

// Feature flags
export const featureFlags = {
  enableRealTimeUpdates: true,
  enableAIModeration: true,
  enableCrisisDetection: true,
  enableAnalytics: true,
  enableAdvancedSearch: true,
  enableUserProfiles: true,
  enableWebSocket: true,
  enableNotifications: true,
  enableDarkMode: true,
  enableMobileApp: true
};

export const isFeatureEnabled = (feature) => {
  return featureFlags[feature] || false;
};