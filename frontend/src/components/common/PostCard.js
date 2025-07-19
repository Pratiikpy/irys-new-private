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

const PostCard = ({ confession, onVote, onReply, currentUser }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(confession.upvotes || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
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
      return 'just now';
    }
  };

  // Enhanced vote function with proper user tracking
  const handleVote = async (voteType) => {
    try {
      const userIdentifier = currentUser?.wallet_address || currentUser?.id || 'anonymous';
      const existingVote = localStorage.getItem(`vote_${confession.tx_id}_${userIdentifier}`);
      
      let newVoteType = null;
      let voteChange = 0;
      
      if (existingVote === voteType) {
        localStorage.removeItem(`vote_${confession.tx_id}_${userIdentifier}`);
        newVoteType = null;
        voteChange = voteType === 'upvote' ? -1 : 1;
      } else {
        localStorage.setItem(`vote_${confession.tx_id}_${userIdentifier}`, voteType);
        newVoteType = voteType;
        
        if (existingVote === 'upvote' && voteType === 'downvote') {
          voteChange = -2;
        } else if (existingVote === 'downvote' && voteType === 'upvote') {
          voteChange = 2;
        } else if (voteType === 'upvote') {
          voteChange = 1;
        } else {
          voteChange = -1;
        }
      }
      
      setLiked(newVoteType === 'upvote');
      setLikeCount(prev => prev + voteChange);
      
      if (onVote) {
        await onVote(confession.tx_id, voteType);
      }
    } catch (error) {
      console.error('Error voting:', error);
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

  // Initialize bookmark state
  useEffect(() => {
    const userIdentifier = currentUser?.wallet_address || currentUser?.id || 'anonymous';
    const bookmarkKey = `bookmark_${confession.tx_id}_${userIdentifier}`;
    const bookmarked = localStorage.getItem(bookmarkKey);
    setIsBookmarked(!!bookmarked);
  }, [confession.tx_id, currentUser]);

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/confession/${confession.tx_id}`;
      await navigator.clipboard.writeText(shareUrl);
      // Show success notification
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewOnBlockchain = () => {
    if (confession.tx_id) {
      window.open(`https://gateway.irys.xyz/${confession.tx_id}`, '_blank');
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
          <button className="action-button" onClick={() => setShowReplies(!showReplies)}>
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
                  onClick={() => {
                    // Handle reply submission
                    setReplyContent('');
                  }}
                  disabled={!replyContent.trim() || isSubmittingReply}
                >
                  Reply
                </button>
              </div>
            </div>

            <div className="replies-list">
              {replies.map((reply, index) => (
                <div key={index} className="reply-item">
                  <div className="reply-header">
                    <span className="reply-author">u/{reply.author}</span>
                    <span className="reply-time">{formatTimeAgo(reply.timestamp)}</span>
                  </div>
                  <div className="reply-content">{reply.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard; 