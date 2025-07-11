import { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  const [notificationPermission, setNotificationPermission] = useState(
    notificationService.permission
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const [inPageNotifications, setInPageNotifications] = useState([]);
  const { user } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    // Check saved preference and current permission
    const savedPreference = localStorage.getItem('notifications-enabled');
    const hasPermission = notificationService.permission === 'granted';
    
    if (savedPreference === 'true' && hasPermission) {
      setIsEnabled(true);
    }
    
    // Update permission state
    setNotificationPermission(notificationService.permission);
  }, []);

  useEffect(() => {
    if (socket && user) {
      // Listen for real-time notification events
      socket.on('message-notification', handleMessageNotification);
      socket.on('new-message', handleNewMessage);

      return () => {
        socket.off('message-notification', handleMessageNotification);
        socket.off('new-message', handleNewMessage);
      };
    }
  }, [socket, user, isEnabled]);

  const enableNotifications = async () => {
    try {
      const granted = await notificationService.requestPermission();
      setNotificationPermission(notificationService.permission);
      
      if (granted) {
        setIsEnabled(true);
        localStorage.setItem('notifications-enabled', 'true');
        toast.success('Notifications enabled! 🔔');
        
        // Show a test notification
        setTimeout(() => {
          showInPageNotification({
            id: Date.now(),
            senderName: 'System',
            senderAvatar: null,
            content: 'You will now receive message notifications',
            messageType: 'text',
            timestamp: new Date()
          });

          notificationService.showNotification({
            title: 'Notifications Enabled',
            body: 'You will now receive message notifications',
            tag: 'welcome-notification'
          });
        }, 1000);
      } else {
        toast.error('Notification permission denied');
        setIsEnabled(false);
        localStorage.setItem('notifications-enabled', 'false');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const disableNotifications = () => {
    setIsEnabled(false);
    localStorage.setItem('notifications-enabled', 'false');
    toast.success('Notifications disabled');
  };

  const showInPageNotification = (notificationData) => {
    console.log('📨 Showing in-page notification:', notificationData);
    setInPageNotifications(prev => [...prev, notificationData]);
  };

  const removeInPageNotification = (id) => {
    setInPageNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Handle real-time message notifications from socket
  const handleMessageNotification = (notificationData) => {
    console.log('🔔 Received message notification:', notificationData);
    
    // Map socket notification data to expected format
    const mappedNotification = {
      id: Date.now(),
      senderName: notificationData.senderName || 'Unknown User',
      senderAvatar: notificationData.senderAvatar || null,
      content: notificationData.message || notificationData.content || '',
      messageType: notificationData.messageType || 'text',
      timestamp: notificationData.timestamp || new Date(),
      chatId: notificationData.chatId,
      fromUser: notificationData.fromUser
    };
    
    // Always show in-page notification
    showInPageNotification(mappedNotification);

    // Show desktop notification only if tab is hidden and notifications are enabled
    if (isEnabled && document.hidden) {
      console.log('📱 Showing desktop notification');
      
      notificationService.showMessageNotification({
        senderName: mappedNotification.senderName,
        message: {
          content: mappedNotification.content,
          messageType: mappedNotification.messageType,
          sender: {
            _id: 'temp',
            name: mappedNotification.senderName,
            avatar: mappedNotification.senderAvatar
          }
        },
        avatar: mappedNotification.senderAvatar,
        chatId: mappedNotification.chatId,
        onClick: (data) => {
          console.log('Notification clicked for chat:', data.chatId);
          window.focus();
        }
      });
    }
  };

  // Handle new messages (for when user is actively chatting)
  const handleNewMessage = (message) => {
    // Don't show notification for own messages
    if (message.sender._id === user?.id) {
      return;
    }

    // This will be handled by handleMessageNotification
    // This listener is kept for compatibility
    console.log('📩 New message received:', message.sender.name);
  };

  const showCustomNotification = (options) => {
    if (!isEnabled) {
      console.log('Notifications not enabled');
      return;
    }
    return notificationService.showNotification(options);
  };

  const value = {
    isSupported: notificationService.isSupported,
    permission: notificationPermission,
    isEnabled,
    enableNotifications,
    disableNotifications,
    showCustomNotification,
    inPageNotifications,
    removeInPageNotification,
    showInPageNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
