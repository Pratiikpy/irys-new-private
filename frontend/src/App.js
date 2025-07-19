import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, MessageCircle, Share2, Plus, ExternalLink, X, Filter, 
  TrendingUp, Clock, Search, User, Settings, LogOut, LogIn,
  Shield, Zap, Globe, Lock, Unlock, Eye, EyeOff, Sparkles,
  ArrowUp, ArrowDown, Hash, Calendar, Users, Activity, Wallet
} from 'lucide-react';
import AuthModal from './components/auth/AuthModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://irys-confession-backend.onrender.com';
const API = `${BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL.replace('http', 'ws') : 'wss://irys-confession-backend.onrender.com';

// Professional Confession Card Component
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

  const formatDate = (dateString) => {
    if (!dateString) return 'just now';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'just now';
      
      const now = new Date();
      const diffMs = now - date;
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

  // Enhanced vote function with cool effects
  const handleLike = async () => {
    try {
      const newLiked = !liked;
      
      // Add haptic feedback (mobile)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Add particle effect
      if (newLiked) {
        createHeartParticles();
      }
      
      setLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
      
      // Add bounce animation
      const button = document.querySelector(`[data-confession-id="${confession.tx_id}"] .vote-button`);
      if (button) {
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
          button.style.transform = 'scale(1)';
        }, 200);
      }
      
      if (onVote) {
        await onVote(confession.tx_id, newLiked ? 'upvote' : 'downvote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      setLiked(!liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
    }
  };

  // Heart particles effect
  const createHeartParticles = () => {
    const hearts = ['❤️', '💖', '💕', '💗', '💓'];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.position = 'fixed';
        heart.style.left = `${Math.random() * window.innerWidth}px`;
        heart.style.top = `${window.innerHeight}px`;
        heart.style.fontSize = '20px';
        heart.style.pointerEvents = 'none';
        heart.style.zIndex = '9999';
        heart.style.transition = 'all 2s ease-out';
        document.body.appendChild(heart);
        
        setTimeout(() => {
          heart.style.top = `${Math.random() * window.innerHeight}px`;
          heart.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(heart);
          }, 2000);
        }, 100);
      }, i * 100);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/confession/${confession.tx_id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      // Show success notification
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

  return (
    <div className={`confession-card ${confession.isNew ? 'new' : ''}`} data-confession-id={confession.tx_id}>
      <div className="confession-header">
        <div className="confession-author">
          <div className="author-avatar">
            {confession.author === 'anonymous' ? '👤' : '👤'}
          </div>
          <div className="author-info">
            <span className="author-name">{confession.author}</span>
            <span className="confession-time">{formatDate(confession.timestamp)}</span>
          </div>
        </div>
        
        <div className="confession-badges">
          {confession.verified && (
            <div className="verified-badge" title="Verified on Blockchain">
              <Shield size={16} />
              <span>Verified</span>
            </div>
          )}
          {confession.crisis_level && confession.crisis_level !== 'none' && (
            <div className={`crisis-badge ${confession.crisis_level}`} title="Crisis Support Available">
              <Zap size={16} />
              <span>Support</span>
            </div>
          )}
        </div>
      </div>

      <div className="confession-content">
        <p className="confession-text">{confession.content}</p>
        
        {confession.tags && confession.tags.length > 0 && (
          <div className="confession-tags">
            {confession.tags.map((tag, index) => (
              <span key={index} className="tag">
                <Hash size={12} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="confession-stats">
        <div className="stat">
          <Eye size={16} />
          <span>{confession.view_count || 0} views</span>
        </div>
        <div className="stat">
          <MessageCircle size={16} />
          <span>{confession.reply_count || 0} replies</span>
        </div>
      </div>

      <div className="confession-actions">
        <div className="vote-actions">
          <button
            onClick={handleLike}
            className={`vote-button ${liked ? 'liked' : ''}`}
            title={liked ? 'Remove vote' : 'Upvote'}
          >
            <Heart className={`vote-icon ${liked ? 'filled' : ''}`} />
            <span>{likeCount}</span>
          </button>
          
          <button 
            onClick={toggleReplies}
            className="action-button"
            title="View replies"
          >
            <MessageCircle className="action-icon" />
            <span>Reply</span>
          </button>
        </div>

        <div className="share-actions">
          <button onClick={handleShare} className="share-button" title="Share">
            <Share2 className="share-icon" />
          </button>
          
          {confession.tx_id && (
            <a
              href={`https://devnet.irys.xyz/${confession.tx_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="external-button"
              title="View on Blockchain"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Opening blockchain link for tx_id:', confession.tx_id);
                window.open(`https://devnet.irys.xyz/${confession.tx_id}`, '_blank');
              }}
            >
              <ExternalLink className="external-icon" />
            </a>
          )}
        </div>
      </div>

      {/* Replies Section */}
      {showReplies && (
        <div className="replies-section">
          <div className="replies-header">
            <h4>Replies ({replies.length})</h4>
          </div>
          
          {/* Reply Form */}
          <form onSubmit={handleReply} className="reply-form">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="reply-textarea"
              maxLength={280}
            />
            <div className="reply-form-footer">
              <span className="char-count">{replyContent.length}/280</span>
              <button 
                type="submit" 
                className="reply-submit-btn"
                disabled={!replyContent.trim() || isSubmittingReply}
              >
                {isSubmittingReply ? 'Posting...' : 'Reply'}
              </button>
            </div>
          </form>
          
          {/* Replies List */}
          <div className="replies-list">
            {replies.map((reply) => (
              <div key={reply.id} className="reply-item">
                <div className="reply-header">
                  <span className="reply-author">{reply.author}</span>
                  <span className="reply-time">{formatDate(reply.timestamp)}</span>
                </div>
                <div className="reply-content">{reply.content}</div>
                <div className="reply-actions">
                  <button className="reply-vote-btn">
                    <Heart size={14} />
                    <span>{reply.upvotes || 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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