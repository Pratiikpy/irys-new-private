import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const reconnectTimeoutRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  const connect = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    const userId = user?.id || 'anonymous';
    const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace('http', 'ws')}/ws/${userId}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setSocket(ws);
      
      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      setSocket(null);
      
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const handleMessage = (data) => {
    console.log('Received WebSocket message:', data);
    
    switch (data.type) {
      case 'new_confession':
        setLiveUpdates(prev => [...prev, {
          id: Date.now(),
          type: 'confession',
          data: data.confession,
          timestamp: new Date()
        }]);
        break;
        
      case 'new_reply':
        setLiveUpdates(prev => [...prev, {
          id: Date.now(),
          type: 'reply',
          data: data.reply,
          timestamp: new Date()
        }]);
        break;
        
      case 'vote_update':
        setLiveUpdates(prev => [...prev, {
          id: Date.now(),
          type: 'vote',
          data: data,
          timestamp: new Date()
        }]);
        break;
        
      case 'crisis_support':
        setLiveUpdates(prev => [...prev, {
          id: Date.now(),
          type: 'crisis',
          data: data.resources,
          timestamp: new Date()
        }]);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const clearUpdates = () => {
    setLiveUpdates([]);
  };

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    // Connect when component mounts
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user?.id]);

  // Auto-clear old updates (keep only last 50)
  useEffect(() => {
    if (liveUpdates.length > 50) {
      setLiveUpdates(prev => prev.slice(-50));
    }
  }, [liveUpdates]);

  const value = {
    socket,
    connected,
    liveUpdates,
    connect,
    disconnect,
    clearUpdates,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};