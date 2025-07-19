import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, MessageCircle, Share2, Plus, ExternalLink, X, Filter, 
  TrendingUp, Clock, Search, User, Settings, LogOut, LogIn,
  Shield, Zap, Globe, Lock, Unlock, Eye, EyeOff, Sparkles,
  ArrowUp, ArrowDown, Hash, Calendar, Users, Activity, Wallet,
  MoreHorizontal, Bookmark, Flag, Send, Smile, Image, Video,
  ChevronUp, ChevronDown, Award, Gift
} from 'lucide-react';
import AuthModal from './components/auth/AuthModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://irys-confession-backend.onrender.com';
const API = `${BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL.replace('http', 'ws') : 'wss://irys-confession-backend.onrender.com';

// Reddit-style Confession Card Component
const ConfessionCard = ({ confession, onVote, onReply, currentUser }) => {
  // Defensive checks to prevent React error #130
  if (!confession) {
    console.error('ConfessionCard: confession prop is undefined');
    return null;
  }
  
  console.log('ConfessionCard received confession:', confession);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(confession.upvotes || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'just now';
    
    try {
      // Handle both ISO string and timestamp formats
      let date;
      if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else if (typeof dateString === 'number') {
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'just now';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'just now';
    }
  };

  // Enhanced vote function with proper user tracking
  const handleVote = async (voteType) => {
    try {
      // Get user identifier (wallet address or user ID)
      const userIdentifier = currentUser?.wallet_address || currentUser?.id || 'anonymous';
      
      // Check if user already voted
      const existingVote = localStorage.getItem(`vote_${confession.tx_id}_${userIdentifier}`);
      
      let newVoteType = null;
      let voteChange = 0;
      
      if (existingVote === voteType) {
        // Remove vote
        localStorage.removeItem(`vote_${confession.tx_id}_${userIdentifier}`);
        newVoteType = null;
        voteChange = voteType === 'upvote' ? -1 : 1;
      } else {
        // Add or change vote
        localStorage.setItem(`vote_${confession.tx_id}_${userIdentifier}`, voteType);
        newVoteType = voteType;
        
        if (existingVote === 'upvote' && voteType === 'downvote') {
          voteChange = -2; // Remove upvote, add downvote
        } else if (existingVote === 'downvote' && voteType === 'upvote') {
          voteChange = 2; // Remove downvote, add upvote
        } else if (voteType === 'upvote') {
          voteChange = 1;
        } else {
          voteChange = -1;
        }
      }
      
      // Add haptic feedback (mobile)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Update local state
      setLiked(newVoteType === 'upvote');
      setLikeCount(prev => prev + voteChange);
      
      // Send vote to backend
      if (onVote) {
        await onVote(confession.tx_id, voteType);
      }
    } catch (error) {
      console.error('Error voting:', error);
      showNotification('Failed to vote', 'error');
    }
  };

  // Initialize vote state from localStorage
  useEffect(() => {
    const userIdentifier = currentUser?.wallet_address || currentUser?.id || 'anonymous';
    const existingVote = localStorage.getItem(`vote_${confession.tx_id}_${userIdentifier}`);
    if (existingVote === 'upvote') {
      setLiked(true);
    }
  }, [confession.tx_id, currentUser]);

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/confession/${confession.tx_id}`;
      await navigator.clipboard.writeText(shareUrl);
      showNotification('Link copied to clipboard!', 'success');
    } catch (error) {
      console.error('Error sharing:', error);
      showNotification('Failed to copy link', 'error');
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await fetch(`${API}/confessions/${confession.tx_id}/replies`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmittingReply) return;

    try {
      setIsSubmittingReply(true);
      const response = await fetch(`${API}/confessions/${confession.tx_id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { 'Authorization': `Bearer ${currentUser.token}` })
        },
        body: JSON.stringify({
          content: replyContent.trim()
        })
      });

      if (response.ok) {
        const newReply = await response.json();
        setReplies(prev => [newReply, ...prev]);
        setReplyContent('');
        showNotification('Reply posted successfully!', 'success');
      } else {
        throw new Error('Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      showNotification('Failed to post reply', 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const toggleReplies = () => {
    if (!showReplies) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  // Enhanced bookmark function with wallet-based storage
  const handleBookmark = () => {
    const userIdentifier = currentUser?.wallet_address || currentUser?.id || 'anonymous';
    const bookmarkKey = `bookmark_${confession.tx_id}_${userIdentifier}`;
    
    if (isBookmarked) {
      localStorage.removeItem(bookmarkKey);
      setIsBookmarked(false);
      showNotification('Removed from bookmarks', 'success');
    } else {
      localStorage.setItem(bookmarkKey, JSON.stringify({
        confessionId: confession.tx_id,
        content: confession.content,
        timestamp: confession.timestamp,
        author: confession.author
      }));
      setIsBookmarked(true);
      showNotification('Added to bookmarks', 'success');
    }
  };

  // Initialize bookmark state from localStorage
  useEffect(() => {
    const userIdentifier = currentUser?.wallet_address || currentUser?.id || 'anonymous';
    const bookmarkKey = `bookmark_${confession.tx_id}_${userIdentifier}`;
    const bookmarked = localStorage.getItem(bookmarkKey);
    setIsBookmarked(!!bookmarked);
  }, [confession.tx_id, currentUser]);

  const handleReport = () => {
    setShowOptions(false);
    showNotification('Report submitted', 'info');
  };

  return (
    <div className={`reddit-post ${confession.isNew ? 'new' : ''}`} data-confession-id={confession.tx_id}>
      {/* Reddit-style voting sidebar */}
      <div className="vote-sidebar">
        <button 
          className={`vote-button upvote ${liked ? 'voted' : ''}`}
          onClick={() => handleVote('upvote')}
          title="Upvote"
        >
          <ChevronUp size={20} />
        </button>
        
        <div className="vote-count">
          {likeCount > 0 ? likeCount : likeCount < 0 ? likeCount : '•'}
        </div>
        
        <button 
          className={`vote-button downvote ${!liked && likeCount < 0 ? 'voted' : ''}`}
          onClick={() => handleVote('downvote')}
          title="Downvote"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Main content area */}
      <div className="post-content">
        {/* Post header */}
        <div className="post-header">
          <div className="post-meta">
            <span className="subreddit">r/confessions</span>
            <span className="posted-by">Posted by u/{confession.author}</span>
            <span className="post-time">{formatDate(confession.timestamp)}</span>
          </div>
          
          <div className="post-options">
            <button 
              className="options-button"
              onClick={() => setShowOptions(!showOptions)}
            >
              <MoreHorizontal size={16} />
            </button>
            
            {showOptions && (
              <div className="options-dropdown">
                <button onClick={handleBookmark} className="option-item">
                  <Bookmark size={16} />
                  {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                </button>
                <button onClick={handleReport} className="option-item">
                  <Flag size={16} />
                  Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post title and content */}
        <div className="post-body">
          <h3 className="post-title">Confession</h3>
          <div className="post-text">{confession.content}</div>
          
          {/* Tags */}
          {confession.tags && confession.tags.length > 0 && (
            <div className="post-tags">
              {confession.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Mood indicator */}
          {confession.mood && (
            <div className="mood-indicator">
              <Smile size={16} />
              <span>{confession.mood}</span>
            </div>
          )}
        </div>

        {/* Blockchain verification */}
        {confession.verified && (
          <div className="blockchain-badge">
            <Shield size={14} />
            <span>Verified on Blockchain</span>
            {confession.tx_id && (
              <a 
                href={`https://devnet.irys.xyz/${confession.tx_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="blockchain-link"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Post actions */}
        <div className="post-actions">
          <button 
            className="action-button"
            onClick={toggleReplies}
          >
            <MessageCircle size={18} />
            <span>{confession.reply_count || replies.length} Comments</span>
          </button>
          
          <button 
            className="action-button"
            onClick={handleShare}
          >
            <Share2 size={18} />
            <span>Share</span>
          </button>
          
          <button 
            className="action-button"
            onClick={handleBookmark}
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            <span>Save</span>
          </button>
        </div>

        {/* Reply section */}
        {showReplies && (
          <div className="replies-section">
            <div className="reply-form">
              <form onSubmit={handleReply}>
                <div className="reply-input-group">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="reply-textarea"
                    disabled={isSubmittingReply}
                    rows={3}
                  />
                  <button 
                    type="submit" 
                    className="reply-submit"
                    disabled={!replyContent.trim() || isSubmittingReply}
                  >
                    {isSubmittingReply ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="replies-list">
              {replies.map((reply) => (
                <div key={reply.id} className="reply-item">
                  <div className="reply-header">
                    <span className="reply-author">u/{reply.author}</span>
                    <span className="reply-time">{formatDate(reply.timestamp)}</span>
                  </div>
                  <div className="reply-content">{reply.content}</div>
                  <div className="reply-actions">
                    <button className="reply-action">
                      <ChevronUp size={14} />
                      <span>{reply.upvotes || 0}</span>
                    </button>
                    <button className="reply-action">
                      <ChevronDown size={14} />
                    </button>
                    <button className="reply-action">Reply</button>
                    <button className="reply-action">Share</button>
                    <button className="reply-action">Report</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Professional Compose Modal
const ComposeModal = ({ isOpen, onClose, onSubmit, currentUser }) => {
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const MAX_CHARS = 280;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      showNotification('Please enter a confession', 'error');
      return;
    }

    if (content.length > MAX_CHARS) {
      showNotification(`Confession must be ${MAX_CHARS} characters or less`, 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API}/confessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { 'Authorization': `Bearer ${currentUser.token}` })
        },
        body: JSON.stringify({
          content: content.trim(),
          is_public: isPublic,
          author: currentUser?.username || 'anonymous',
          tags: tags
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit confession');
      }

      const result = await response.json();
      
      showNotification('🎉 Confession posted to blockchain!', 'success');
      onSubmit(result);
      setContent('');
      setTags([]);
      setIsPublic(true);
      onClose();
      
    } catch (error) {
      console.error('Error submitting confession:', error);
      showNotification(error.message || 'Failed to post confession', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <img src="/irys-logo.png" alt="Irys" className="modal-logo" />
            New Confession
          </h2>
          <button onClick={onClose} className="modal-close">
            <X className="close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="textarea-container">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts anonymously... (This will be permanently stored on the blockchain)"
              className="confession-textarea"
              maxLength={MAX_CHARS}
            />
            <div className="char-count">
              {content.length}/{MAX_CHARS}
            </div>
          </div>

          {/* Tags Section */}
          <div className="tags-section">
            <label className="tags-label">Tags (optional)</label>
            <div className="tags-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags..."
                className="tag-input"
                maxLength={20}
              />
              <button 
                type="button" 
                onClick={addTag}
                className="add-tag-btn"
                disabled={!tagInput.trim() || tags.length >= 5}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag, index) => (
                  <span key={index} className="tag">
                    #{tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="remove-tag"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-options">
            <div className="public-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {isPublic ? (
                    <>
                      <Globe size={16} />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Private
                    </>
                  )}
                </span>
              </label>
            </div>

            <div className="blockchain-info">
              <Shield size={16} />
              <span>Permanently stored on Irys blockchain</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Posting to Blockchain...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Post Confession
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Professional Header Component
const Header = ({ currentUser, onLogin, onLogout, onSettings }) => {
  // Defensive checks to prevent React error #130
  if (!onLogin || !onLogout || !onSettings) {
    console.error('Header: Missing required callback props', { onLogin, onLogout, onSettings });
    return null;
  }
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleUserMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('User menu clicked, current state:', showUserMenu);
    setShowUserMenu(!showUserMenu);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <img src="/irys-logo.png" alt="Irys" className="irys-logo" />
            <h1>Irys Confessions</h1>
          </div>
          <p className="tagline">Anonymous confessions on the blockchain</p>
        </div>

        <div className="header-right">
          <div className="header-actions">
            <button className="search-btn" title="Search">
              <Search size={20} />
            </button>
            
            {currentUser ? (
              <div className="user-menu">
                <button 
                  className="user-btn"
                  onClick={handleUserMenuClick}
                >
                  <div className="user-avatar">
                    {currentUser.isWalletUser ? (
                      <Wallet size={16} />
                    ) : (
                      currentUser.username?.charAt(0).toUpperCase() || '👤'
                    )}
                  </div>
                  <span className="username">
                    {currentUser.isWalletUser 
                      ? `${currentUser.walletAddress?.slice(0, 6)}...${currentUser.walletAddress?.slice(-4)}`
                      : currentUser.username
                    }
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    {currentUser.isWalletUser && (
                      <div className="dropdown-item wallet-info">
                        <Wallet size={16} />
                        <span>Wallet Connected</span>
                      </div>
                    )}
                    <button onClick={onSettings} className="dropdown-item">
                      <Settings size={16} />
                      Settings
                    </button>
                    <button onClick={onLogout} className="dropdown-item">
                      <LogOut size={16} />
                      {currentUser.isWalletUser ? 'Disconnect' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={onLogin} className="login-btn">
                <LogIn size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Professional Filter Bar
const FilterBar = ({ activeFilter, onFilterChange, stats }) => {
  return (
    <div className="filter-bar">
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${activeFilter === 'latest' ? 'active' : ''}`}
          onClick={() => onFilterChange('latest')}
        >
          <Clock size={16} />
          Latest
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'trending' ? 'active' : ''}`}
          onClick={() => onFilterChange('trending')}
        >
          <TrendingUp size={16} />
          Trending
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'popular' ? 'active' : ''}`}
          onClick={() => onFilterChange('popular')}
        >
          <Heart size={16} />
          Popular
        </button>
      </div>

      {stats && (
        <div className="stats-bar">
          <div className="stat-item">
            <Users size={16} />
            <span>{stats.total_users || 0} users</span>
          </div>
          <div className="stat-item">
            <MessageCircle size={16} />
            <span>{stats.total_confessions || 0} confessions</span>
          </div>
          <div className="stat-item">
            <Activity size={16} />
            <span>{stats.last_24h?.confessions || 0} today</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Floating Action Button
const Fab = ({ onClick }) => {
  return (
    <button className="fab" onClick={onClick} title="New Confession">
      <Plus size={24} />
    </button>
  );
};

// Notification System
let notificationTimeout;
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
  
  // Auto remove
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
  
  // Manual close
  notification.querySelector('.notification-close').onclick = () => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  };
};

// Main App Component
function App() {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [activeFilter, setActiveFilter] = useState('latest');
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`${WS_URL}/ws/anonymous`);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsConnection(ws);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            if (data.type === 'new_confession') {
              console.log('New confession data:', data.confession);
              setConfessions(prev => [data.confession, ...prev]);
              showNotification('New confession posted!', 'info');
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnection(null);
          // Reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  // Fetch network info
  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch(`${API}/irys/network-info`);
      if (response.ok) {
        const data = await response.json();
        setNetworkInfo(data);
      }
    } catch (error) {
      console.error('Error fetching network info:', error);
    }
  };

  // Fetch confessions
  const fetchConfessions = async () => {
    try {
      setLoading(true);
      let url = `${API}/confessions/public`;
      
      if (activeFilter === 'trending') {
        url = `${API}/trending`;
      } else if (activeFilter === 'popular') {
        url = `${API}/confessions/public?sort_by=upvotes&order=desc`;
      }
      
      console.log('Fetching confessions from:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Confessions data:', data);
        console.log('First confession structure:', data.confessions?.[0]);
        setConfessions(data.confessions || []);
      } else {
        console.error('Failed to fetch confessions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching confessions:', error);
      showNotification('Failed to load confessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch platform stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/analytics/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Handle new confession with celebration effects
  const handleNewConfession = (newConfession) => {
    if (!newConfession || !newConfession.tx_id) {
      console.error('Invalid confession data:', newConfession);
      showNotification('Error: Invalid confession data', 'error');
      return;
    }

    // Add the new confession with animation
    const confessionWithAnimation = {
      ...newConfession,
      isNew: true // Add this flag for animation
    };
    
    setConfessions(prev => [confessionWithAnimation, ...prev]);
    
    // Show blockchain link
    const blockchainUrl = newConfession.blockchain_url || `https://devnet.irys.xyz/${newConfession.tx_id}`;
    showNotification(`🎉 Confession posted! View on blockchain: ${blockchainUrl}`, 'success');
    
    // Add confetti effect
    createConfetti();
    
    // Remove the "new" flag after animation
    setTimeout(() => {
      setConfessions(prev => 
        prev.map(c => 
          c.tx_id === newConfession.tx_id 
            ? { ...c, isNew: false }
            : c
        )
      );
    }, 3000);
  };

  // Confetti effect function
  const createConfetti = () => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = `${Math.random() * window.innerWidth}px`;
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.transition = 'all 3s ease-out';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.style.top = `${window.innerHeight + 10}px`;
          confetti.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(confetti);
          }, 3000);
        }, 100);
      }, i * 50);
    }
  };

  // Handle voting
  const handleVote = async (txId, voteType) => {
    try {
      const response = await fetch(`${API}/confessions/${txId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { 'Authorization': `Bearer ${currentUser.token}` })
        },
        body: JSON.stringify({
          vote_type: voteType,
          user_address: currentUser?.username || 'anonymous'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      showNotification('Failed to vote', 'error');
    }
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Handle login/logout
  const handleLogin = () => {
    console.log('Login button clicked');
    setShowAuth(true);
  };

  const handleLogout = () => {
    console.log('Logout button clicked');
    localStorage.removeItem('user');
    setCurrentUser(null);
    showNotification('Logged out successfully', 'success');
  };

  const handleSettings = () => {
    console.log('Settings button clicked');
    showNotification('Settings feature coming soon!', 'info');
  };

  const handleAuthSuccess = (data) => {
    if (data.authType === 'wallet') {
      // Handle wallet authentication
      setCurrentUser({
        walletAddress: data.user.walletAddress,
        authType: 'wallet',
        isWalletUser: true
      });
      showNotification('Wallet connected! You can now post anonymous confessions. 🎉', 'success');
    } else {
      // Handle traditional authentication
      setCurrentUser(data.user);
      showNotification('Welcome to Irys Confessions! 🎉', 'success');
    }
    setShowAuth(false);
  };

  // Check for existing user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchNetworkInfo();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchConfessions();
  }, [activeFilter]);

  return (
    <ErrorBoundary>
      <div className="app">
        <Header 
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onSettings={handleSettings}
        />
        
        <FilterBar 
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          stats={stats}
        />

        <main className="main-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading confessions from blockchain...</p>
            </div>
          ) : confessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-image">
                <img src="/irys-banner.png" alt="Irys Confessions" className="irys-banner" />
              </div>
              <h3>No confessions yet</h3>
              <p>Be the first to share your thoughts anonymously on the blockchain!</p>
              <button onClick={() => setShowCompose(true)} className="cta-button">
                <Plus size={16} />
                Post First Confession
              </button>
            </div>
          ) : (
            <div className="confessions-grid">
              {confessions.map((confession) => (
                <ConfessionCard
                  key={confession.tx_id || confession.id}
                  confession={confession}
                  onVote={handleVote}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </main>

        <Fab onClick={() => setShowCompose(true)} />

        <ComposeModal
          isOpen={showCompose}
          onClose={() => setShowCompose(false)}
          onSubmit={handleNewConfession}
          currentUser={currentUser}
        />

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />

        {networkInfo && (
          <div className="network-status">
            <div className="network-indicator">
              <div className="status-dot online"></div>
              <span>Connected to Irys {networkInfo.network}</span>
            </div>
            <div className="irys-branding">
              <img src="/irys-eyes.png" alt="Irys" className="irys-eyes" />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;