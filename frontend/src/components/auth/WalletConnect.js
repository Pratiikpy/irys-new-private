import React, { useState, useEffect } from 'react';
import { Wallet, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ethers } from 'ethers';
import './WalletConnect.css';

const WalletConnect = ({ onConnect, onError }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
  };

  // Check if already connected
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const address = accounts[0].address;
        setWalletAddress(address);
        setIsConnected(true);
        onConnect({ address, provider });
      }
    } catch (err) {
      console.log('No existing connection');
    }
  };

  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      onError('MetaMask not installed');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      
      // Get network info
      const network = await provider.getNetwork();
      
      // Verify it's Ethereum mainnet or testnet
      if (network.chainId !== 1n && network.chainId !== 11155111n) {
        setError('Please connect to Ethereum mainnet or Sepolia testnet');
        onError('Wrong network');
        return;
      }

      setWalletAddress(address);
      setIsConnected(true);
      
      // Create signature for verification
      const signer = await provider.getSigner();
      const message = `Connect to Irys Confession Board\n\nTimestamp: ${Date.now()}\n\nThis signature verifies your wallet ownership for anonymous confessions.`;
      const signature = await signer.signMessage(message);
      
      onConnect({ 
        address, 
        provider, 
        signature,
        network: network.name,
        chainId: network.chainId.toString()
      });

      // Show success notification
      showNotification('Wallet connected successfully! 🎉', 'success');

    } catch (err) {
      console.error('Wallet connection error:', err);
      
      if (err.code === 4001) {
        setError('Connection rejected by user');
        onError('User rejected connection');
      } else if (err.code === -32002) {
        setError('Please check MetaMask for pending connection request');
        onError('Pending request');
      } else {
        setError('Failed to connect wallet. Please try again.');
        onError('Connection failed');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    setError('');
    onConnect(null);
    showNotification('Wallet disconnected', 'info');
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

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <CheckCircle size={20} className="wallet-icon connected" />
          <div className="wallet-details">
            <span className="wallet-label">Connected</span>
            <span className="wallet-address">{formatAddress(walletAddress)}</span>
          </div>
        </div>
        <button 
          onClick={disconnectWallet}
          className="wallet-disconnect-btn"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      {error && (
        <div className="wallet-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="wallet-connect-btn"
      >
        {isConnecting ? (
          <>
            <Loader size={16} className="spinning" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet size={16} />
            Connect MetaMask
          </>
        )}
      </button>
      
      <div className="wallet-features">
        <div className="feature-item">
          <CheckCircle size={14} />
          <span>Anonymous blockchain verification</span>
        </div>
        <div className="feature-item">
          <CheckCircle size={14} />
          <span>No personal data required</span>
        </div>
        <div className="feature-item">
          <CheckCircle size={14} />
          <span>Secure signature verification</span>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect; 