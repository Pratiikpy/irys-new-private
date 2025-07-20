import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, Filter } from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Header from './components/layout/Header';
import PostCard from './components/common/PostCard';
import MetaMaskLogin from './components/auth/MetaMaskLogin';

// API configuration - Use production URL if available
const API = process.env.REACT_APP_API_URL || 'https://irys-confession-backend.onrender.com/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'wss://irys-confession-backend.onrender.com/ws';

// Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
};

// Compose Modal Component
const ComposeModal = ({ isOpen, onClose, onSubmit, currentUser }) => {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

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
          tags: tags,
          is_public: isPublic,
          author: currentUser?.username || 'anonymous'
        })
      });

      if (response && response.ok) {
        const newConfession = await response.json();
        onSubmit(newConfession);
        setContent('');
        setTags([]);
        onClose();
        showNotification('Confession posted successfully!', 'success');
      } else {
        throw new Error('Failed to post confession');
      }
    } catch (error) {
      console.error('Error posting confession:', error);
      showNotification('Failed to post confession', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <div className="irys-logo">IRYS</div>
            New Confession
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Confession</label>
            <textarea
              className="form-textarea"
              placeholder="Share your thoughts anonymously... (This will be permanently stored on the Irys blockchain)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={280}
              required
            />
            <div className="char-counter">
              {content.length}/280
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (optional)</label>
            <div className="tags-input">
              {tags.map((tag, index) => (
                <div key={index} className="tag-item">
                  <span>{tag}</span>
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={() => removeTag(tag)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <input
                type="text"
                className="tag-input"
                placeholder="Add tags..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag(e)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 5}
              >
                Add
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span>Public Confession</span>
            </div>
            <p className="form-help">
              Permanently stored on Irys blockchain.
            </p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Confession'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Filter Bar Component
const FilterBar = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { key: 'latest', label: 'Latest' },
    { key: 'trending', label: 'Trending' },
    { key: 'popular', label: 'Popular' },
    { key: 'new', label: 'New' }
  ];

  return (
    <div className="filter-bar">
      {filters.map(filter => (
        <button
          key={filter.key}
          className={`filter-button ${activeFilter === filter.key ? 'active' : ''}`}
          onClick={() => onFilterChange(filter.key)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

// Floating Action Button
const Fab = ({ onClick }) => (
  <button className="fab" onClick={onClick} title="New Confession">
    <Plus size={24} />
  </button>
);

// Main App Component
function App() {
  const [confessions, setConfessions] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    // Initialize currentUser from localStorage if available
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showMetaMaskLogin, setShowMetaMaskLogin] = useState(false);
  const [activeFilter, setActiveFilter] = useState('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [connectionError, setConnectionError] = useState(false);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const websocket = new WebSocket(`${WS_URL}/anonymous`);
        
        websocket.onopen = () => {
          console.log('WebSocket connected');
          setConnectionError(false);
        };
        
        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_confession') {
              setConfessions(prev => [data.confession, ...prev]);
              showNotification('New confession posted!', 'info');
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        websocket.onclose = () => {
          console.log('WebSocket disconnected');
          setConnectionError(true);
          setTimeout(connectWebSocket, 3000);
        };
        
        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionError(true);
        };
        
        setWs(websocket);
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        setConnectionError(true);
      }
    };

    connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [WS_URL]);

  // Fetch network info
  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch(`${API}/irys/network-info`);
      if (response && response.ok) {
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
      setIsLoading(true);
      const response = await fetch(`${API}/confessions/public?sort_by=timestamp&order=desc`);
      if (response && response.ok) {
        const data = await response.json();
        setConfessions(data.confessions || []);
        setConnectionError(false);
      } else {
        throw new Error('Failed to fetch confessions');
      }
    } catch (error) {
      console.error('Error fetching confessions:', error);
      setConnectionError(true);
      showNotification('Failed to load confessions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new confession
  const handleNewConfession = (newConfession) => {
    if (newConfession && newConfession.tx_id) {
      setConfessions(prev => [newConfession, ...prev]);
      showNotification('Confession posted successfully!', 'success');
    }
  };

  // Handle vote
  const handleVote = async (txId, voteType, userIdentifier) => {
    try {
      const response = await fetch(`${API}/confessions/${txId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { 'Authorization': `Bearer ${currentUser.token}` })
        },
        body: JSON.stringify({ 
          vote_type: voteType, 
          wallet_address: userIdentifier 
        })
      });

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to vote');
      }
      
      // Update the confession in the list with new vote count
      setConfessions(prev => prev.map(confession => {
        if (confession.tx_id === txId) {
          const voteChange = voteType === 'upvote' ? 1 : -1;
          return {
            ...confession,
            upvotes: Math.max(0, (confession.upvotes || 0) + voteChange)
          };
        }
        return confession;
      }));
      
      showNotification(`${voteType} recorded!`, 'success');
    } catch (error) {
      console.error('Error voting:', error);
      showNotification(error.message || 'Failed to vote', 'error');
    }
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Handle login
  const handleLogin = () => {
    setShowMetaMaskLogin(true);
  };

  // Handle MetaMask login success
  const handleMetaMaskLogin = (user) => {
    setCurrentUser(user);
    showNotification(`Welcome, ${user.username}!`, 'success');
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    showNotification('Logged out successfully', 'success');
  };

  // Handle settings
  const handleSettings = () => {
    showNotification('Settings feature coming soon!', 'info');
  };

  // Load data on mount
  useEffect(() => {
    fetchConfessions();
    fetchNetworkInfo();
  }, [activeFilter]);

  return (
    <div className="app">
      <Header
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSettings={handleSettings}
      />

      <main className="main-content">
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />

        {connectionError && (
          <div className="connection-error">
            <p>⚠️ Unable to connect to backend. Please check if the server is running.</p>
            <button className="btn btn-secondary" onClick={fetchConfessions}>
              Retry Connection
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Loading confessions...</span>
          </div>
        ) : confessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No confessions yet</h3>
            <p>Be the first to share your thoughts anonymously on the blockchain!</p>
            <button className="btn btn-primary" onClick={() => setShowComposeModal(true)}>
              <Plus size={16} />
              Post First Confession
            </button>
          </div>
        ) : (
          <div className="confessions-list">
            {confessions.map((confession, index) => (
              <PostCard
                key={confession.tx_id || index}
                confession={confession}
                onVote={handleVote}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </main>

      <Fab onClick={() => setShowComposeModal(true)} />

      <ComposeModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSubmit={handleNewConfession}
        currentUser={currentUser}
      />

      <MetaMaskLogin
        isOpen={showMetaMaskLogin}
        onClose={() => setShowMetaMaskLogin(false)}
        onLogin={handleMetaMaskLogin}
      />

      {networkInfo && (
        <div className="network-status">
          <span>Connected to Irys {networkInfo.network}</span>
        </div>
      )}
    </div>
  );
}

// Wrapped App with Theme Provider
function AppWithTheme() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default AppWithTheme;