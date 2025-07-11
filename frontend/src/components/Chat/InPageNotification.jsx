import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Image, Video, FileText, File } from 'lucide-react';
import { useState, useEffect } from 'react';

const InPageNotification = ({ notification, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const interval = 50; // Update every 50ms
    const decrementAmount = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrementAmount;
        if (newProgress <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  const getMessageIcon = () => {
    switch (notification.messageType) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'file':
        return File;
      default:
        return MessageCircle;
    }
  };

  const getMessagePreview = () => {
    switch (notification.messageType) {
      case 'image':
        return '📷 Sent an image';
      case 'video':
        return '🎥 Sent a video';
      case 'document':
        return '📄 Sent a document';
      case 'file':
        return '📎 Sent a file';
      default:
        return notification.content.length > 40 
          ? notification.content.substring(0, 40) + '...'
          : notification.content;
    }
  };

  const MessageIcon = getMessageIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -100, scale: 0.8 }}
      className="fixed top-4 right-4 z-[9999] max-w-sm w-full"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <motion.div
            className="h-full bg-gradient-to-r from-rose-500 to-pink-600"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>

        {/* Notification content */}
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Sender avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                {notification.senderAvatar ? (
                  <img 
                    src={notification.senderAvatar} 
                    alt={notification.senderName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  notification.senderName.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Message content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {notification.senderName}
                </p>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <MessageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600 truncate">
                  {getMessagePreview()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InPageNotificationContainer = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-0 right-0 z-[9998] p-4 space-y-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <InPageNotification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default InPageNotificationContainer;
