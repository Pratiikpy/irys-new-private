import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  MessageCircle, 
  Share2, 
  Bookmark,
  MoreHorizontal,
  ExternalLink,
  Shield,
  Clock,
  User
} from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'https://irys-confession-backend.onrender.com/api';

const PostCard = ({ confession, onVote, onReply, currentUser }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(confession.upvotes || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Format vote count (1.2k, 15.3k, etc.)
  const formatVoteCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'just now';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'just now';
      
      return date.toLocaleString(); // Show local time
    } catch (error) {
      return 'just now';
    }
  };

  // Enhanced vote function with proper user tracking
  const handleVote = async (voteType) => {
    if (!currentUser || !currentUser.wallet_address) {
      alert('Connect your wallet to vote!');
      return;
    }
    try {
      // Send vote to backend with wallet address
      if (onVote) {
        await onVote(confession.tx_id, voteType, currentUser.wallet_address);
        // Update localStorage for this vote
        const userIdentifier = currentUser.wallet_address;
        localStorage.setItem(`vote_${confession.tx_id}_${userIdentifier}`, voteType);
        setLiked(voteType === 'upvote');
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Helper to get user identifier
  const getUserIdentifier = () => currentUser?.wallet_address || currentUser?.id || 'anonymous';

  // Clear vote/bookmark state for previous wallet when wallet changes
  useEffect(() => {
    // On wallet change, clear all vote and bookmark state for this post for previous wallet
    // (This prevents showing upvoted/bookmarked for wrong wallet)
    // Optionally, you can clear all vote_*/bookmark_* keys in localStorage, but here we just reset state
    setLiked(false);
    setIsBookmarked(false);
  }, [currentUser?.wallet_address]);

  // Initialize vote state from localStorage for current wallet
  useEffect(() => {
    const userIdentifier = getUserIdentifier();
    const existingVote = localStorage.getItem(`vote_${confession.tx_id}_${userIdentifier}`);
    setLiked(existingVote === 'upvote');
  }, [confession.tx_id, currentUser?.wallet_address]);

  // Initialize bookmark state for current wallet
  useEffect(() => {
    const userIdentifier = getUserIdentifier();
    const bookmarkKey = `bookmark_${confession.tx_id}_${userIdentifier}`;
    const bookmarked = localStorage.getItem(bookmarkKey);
    setIsBookmarked(!!bookmarked);
  }, [confession.tx_id, currentUser?.wallet_address]);

  // Enhanced bookmark function
  const handleBookmark = () => {
    const userIdentifier = currentUser?.wallet_address || currentUser?.id || 'anonymous';
    const bookmarkKey = `bookmark_${confession.tx_id}_${userIdentifier}`;
    
    if (isBookmarked) {
      localStorage.removeItem(bookmarkKey);
      setIsBookmarked(false);
    } else {
      localStorage.setItem(bookmarkKey, JSON.stringify({
        confessionId: confession.tx_id,
        content: confession.content,
        timestamp: confession.timestamp,
        author: confession.author
      }));
      setIsBookmarked(true);
    }
  };

  const handleShare = async () => {
    try {
      // Share the blockchain URL instead of frontend route
      const shareUrl = `https://gateway.irys.xyz/${confession.tx_id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'notification success';
      notification.textContent = 'Confession URL copied to clipboard!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewOnBlockchain = () => {
    if (confession.tx_id) {
      window.open(`https://gateway.irys.xyz/${confession.tx_id}`, '_blank');
    }
  };

  // Fetch replies from backend
  const fetchReplies = async () => {
    setRepliesLoading(true);
    setRepliesError(null);
    try {
      const response = await fetch(`${API}/confessions/${confession.tx_id}/replies`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies || []);
      } else {
        setRepliesError('Failed to load comments');
      }
    } catch (error) {
      setRepliesError('Failed to load comments');
    } finally {
      setRepliesLoading(false);
    }
  };

  // Show/hide replies and fetch on open
  const handleShowReplies = () => {
    setShowReplies((prev) => {
      const next = !prev;
      if (next && replies.length === 0) fetchReplies();
      return next;
    });
  };

  // Submit a reply to backend
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      const response = await fetch(`${API}/confessions/${confession.tx_id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() })
      });
      if (response.ok) {
        setReplyContent('');
        fetchReplies();
      } else {
        alert('Failed to post comment');
      }
    } catch (error) {
      alert('Failed to post comment');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <article className="post-card">
      {/* Vote Sidebar */}
      <div className="vote-sidebar">
        <button 
          className={`vote-button upvote ${liked ? 'voted' : ''}`}
          onClick={() => handleVote('upvote')}
          title="Upvote"
        >
          <ChevronUp size={20} />
        </button>
        
        <div className={`vote-count ${liked ? 'voted-up' : ''}`}>
          {formatVoteCount(likeCount)}
        </div>
        
        <button 
          className={`vote-button downvote ${!liked && likeCount < 0 ? 'voted' : ''}`}
          onClick={() => handleVote('downvote')}
          title="Downvote"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="post-content">
        {/* Post Header */}
        <div className="post-header">
          <div className="post-meta">
            <span className="subreddit">r/confessions</span>
            <span className="posted-by">
              <User size={12} />
              u/{confession.author || 'anonymous'}
            </span>
            <span className="post-time">
              <Clock size={12} />
              {formatTimeAgo(confession.timestamp)}
            </span>
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
                <button onClick={handleViewOnBlockchain} className="option-item">
                  <ExternalLink size={16} />
                  View on Blockchain
                </button>
                <button onClick={handleBookmark} className="option-item">
                  <Bookmark size={16} />
                  {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                </button>
                <button className="option-item">
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Body */}
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
          
          {/* Blockchain Badge */}
          {confession.tx_id && (
            <div className="blockchain-badge" onClick={handleViewOnBlockchain}>
              <Shield size={14} />
              <span>Verified on Blockchain</span>
              <ExternalLink size={12} className="blockchain-link" />
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="post-actions">
          <button className="action-button" onClick={handleShowReplies}>
            <MessageCircle size={18} />
            <span>{replies.length || 0} Comments</span>
          </button>

          <button className="action-button" onClick={handleShare}>
            <Share2 size={18} />
            <span>Share</span>
          </button>

          <button 
            className={`action-button ${isBookmarked ? 'saved' : ''}`}
            onClick={handleBookmark}
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            <span>Save</span>
          </button>
        </div>

        {/* Reply Section */}
        {showReplies && (
          <div className="replies-section">
            <div className="reply-form">
              <div className="reply-input-group">
                <textarea
                  className="reply-textarea"
                  placeholder="What are your thoughts?"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  maxLength={500}
                />
                <button 
                  className="reply-submit"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || isSubmittingReply}
                >
                  {isSubmittingReply ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>

            {repliesLoading ? (
              <div className="replies-list">Loading comments...</div>
            ) : repliesError ? (
              <div className="replies-list error">{repliesError}</div>
            ) : (
              <div className="replies-list">
                {replies.length === 0 ? (
                  <div className="reply-item">No comments yet.</div>
                ) : (
                  replies.map((reply, index) => (
                    <div key={index} className="reply-item">
                      <div className="reply-header">
                        <span className="reply-author">u/{reply.author}</span>
                        <span className="reply-time">{formatTimeAgo(reply.timestamp)}</span>
                      </div>
                      <div className="reply-content">{reply.content}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard; 