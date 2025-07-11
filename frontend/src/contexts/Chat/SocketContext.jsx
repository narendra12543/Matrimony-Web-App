import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const { user } = useAuth();

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
      console.log('Page visibility changed:', !document.hidden ? 'visible' : 'hidden');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (user) {
      console.log('🔌 Attempting to connect to socket for user:', user);
      console.log('User data:', user);
      
      if (!user._id) {
        console.error('❌ No user ID found');
        return;
      }
      
      setConnectionStatus('connecting');
      
      const newSocket = io('http://localhost:5000', {
        query: {
          userId: user._id
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server');
        console.log('Socket ID:', newSocket.id);
        setConnectionStatus('connected');
        setSocket(newSocket);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setConnectionStatus('error');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server. Reason:', reason);
        setConnectionStatus('disconnected');
        setSocket(null);
      });

      // Handle user online/offline status
      newSocket.on('user-online', ({ userId }) => {
        console.log(`👋 User ${userId} came online`);
        setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
      });

      newSocket.on('user-offline', ({ userId }) => {
        console.log(`👋 User ${userId} went offline`);
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      newSocket.on('online-users', (userIds) => {
        setOnlineUsers(userIds);
      });

      return () => {
        console.log('🔌 Cleaning up socket connection');
        newSocket.close();
        setSocket(null);
        setConnectionStatus('disconnected');
      };
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    socket.on('online-users', (userIds) => {
      setOnlineUsers(userIds);
    });

    socket.on('user-online', ({ userId }) => {
      setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });

    socket.on('user-offline', ({ userId }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    return () => {
      socket.off('online-users');
      socket.off('user-online');
      socket.off('user-offline');
    };
  }, [socket]);

  const value = {
    socket,
    onlineUsers,
    isVisible,
    connectionStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
