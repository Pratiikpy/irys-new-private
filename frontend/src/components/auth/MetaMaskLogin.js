import React, { useState } from 'react';
import { Wallet, User, X, Check } from 'lucide-react';

const MetaMaskLogin = ({ isOpen, onClose, onLogin }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [step, setStep] = useState('connect'); // 'connect' or 'username'

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed! Please install MetaMask to continue.');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setStep('username');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      alert('Username must be between 3 and 20 characters');
      return;
    }

    // Create user object
    const user = {
      wallet_address: walletAddress,
      username: username.trim(),
      id: walletAddress,
      isConnected: true,
      loginMethod: 'metamask'
    };

    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Call parent callback
    onLogin(user);
    onClose();
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal metamask-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Wallet size={20} />
            Connect Wallet
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {step === 'connect' ? (
            <div className="connect-step">
              <div className="metamask-icon">
                <Wallet size={48} />
              </div>
              
              <h3>Connect with MetaMask</h3>
              <p>Connect your wallet to post confessions and interact with the blockchain.</p>
              
              <button 
                className="btn btn-primary metamask-btn"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </button>
              
              <div className="wallet-info">
                <p>Don't have MetaMask?</p>
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="metamask-link"
                >
                  Download MetaMask
                </a>
              </div>
            </div>
          ) : (
            <div className="username-step">
              <div className="wallet-connected">
                <Check size={20} className="check-icon" />
                <span>Wallet Connected</span>
              </div>
              
              <div className="wallet-address">
                {formatAddress(walletAddress)}
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  Choose Username
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your username (3-20 characters)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                />
                <div className="char-counter">
                  {username.length}/20
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setStep('connect')}
                >
                  Back
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleUsernameSubmit}
                  disabled={!username.trim() || username.length < 3}
                >
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaMaskLogin; 