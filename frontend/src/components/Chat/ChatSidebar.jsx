import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MessageCircle, LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/Chat/AuthContext';
import UserSearch from './UserSearch';
import NotificationSettings from './NotificationSettings';
import { useNotifications } from '../../contexts/Chat/NotificationContext';
import { useSocket } from '../../contexts/Chat/SocketContext';
import { format, isToday, isYesterday } from 'date-fns';

const ChatSidebar = ({ chats, selectedChat, onChatSelect, onNewChat, onShowUserSearch, onShowNotificationSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const { isEnabled: notificationsEnabled } = useNotifications();
  const { socket, onlineUsers, connectionStatus } = useSocket();

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.participants.find(p => p._id !== user._id);
    return otherUser?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherUser?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           `${otherUser?.firstName} ${otherUser?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatLastMessageTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM dd');
    }
  };

  const getLastMessagePreview = (message) => {
    if (!message) return 'No messages yet';
    
    // Handle different message types
    switch (message.messageType) {
      case 'image':
        return '📷 Image';
      case 'video':
        return '🎥 Video';
      case 'document':
        return '📄 Document';
      case 'file':
        return '📎 File';
      default: {
        // Handle emoji-only messages
        const isEmojiOnly = (text) => {
          if (typeof text !== 'string') return false;
          const withoutEmojis = text.replace(/\p{Emoji}/gu, '');
          return withoutEmojis.trim().length === 0 && text.trim().length > 0;
        };

        if (isEmojiOnly(message.content)) {
          return message.content;
        }

        if (typeof message.content !== 'string') return '';
        return message.content.length > 50 
          ? message.content.substring(0, 50) + '...'
          : message.content;
      }
    }
  };

  return (
    <>
      <div className="h-full flex flex-col  bg-gray-50">
        {/* Header */}
        <div className="p-3 sm:p-6 bg-white border-b border-gray-200">
          {/* User Profile */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg text-sm sm:text-base">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <p className="text-xs sm:text-sm text-emerald-600 font-medium">Active now</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onShowNotificationSettings(true)}
                className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 ${
                  notificationsEnabled 
                    ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onShowUserSearch(true)}
                className="p-2 sm:p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                title="New Chat"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="p-2 sm:p-2.5 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-xl transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all duration-200 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto chat-scroll">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 text-center">
                {searchTerm ? 'No chats found' : 'Start a conversation'}
              </h3>
              <p className="text-center text-gray-500 mb-4 sm:mb-6 max-w-xs text-sm sm:text-base">
                {searchTerm ? 'Try searching with a different name' : 'Connect with someone special and start chatting'}
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onShowUserSearch(true)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                >
                  Find People
                </motion.button>
              )}
            </div>
          ) : (
            <div className="p-2 sm:p-3 space-y-1">
              {filteredChats.map((chat) => {
                const otherUser = chat.participants.find(p => p._id !== user._id);
                const isSelected = selectedChat?._id === chat._id;
                const isOtherUserOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

                return (
                  <motion.div
                    key={chat._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChatSelect(chat)}
                    className={`flex items-center p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 shadow-md' 
                        : 'hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                        {otherUser?.avatar ? (
                          <img 
                            src={otherUser.avatar} 
                            alt={`${otherUser.firstName} ${otherUser.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          `${otherUser?.firstName?.charAt(0) || ''}${otherUser?.lastName?.charAt(0) || ''}`.toUpperCase()
                        )}
                      </div>
                      {isOtherUserOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 ml-3 sm:ml-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {otherUser?.firstName} {otherUser?.lastName}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatLastMessageTime(chat.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {getLastMessagePreview(chat.lastMessage)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>


    </>
  );
};

export default ChatSidebar;
