import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, MessageCircle, LogOut, User, Bell } from "lucide-react";
import { useAuth } from "../../contexts/Chat/AuthContext";
import { getImageUrl } from "../../utils/imageUtils";
import UserSearch from "./UserSearch";
import NotificationSettings from "./NotificationSettings";
import { useNotifications } from "../../contexts/Chat/NotificationContext";
import { useSocket } from "../../contexts/Chat/SocketContext";
import { format, isToday, isYesterday } from "date-fns";

const ChatSidebar = ({
  chats,
  selectedChat,
  onChatSelect,
  onNewChat,
  onShowUserSearch,
  onShowNotificationSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user, logout } = useAuth();
  const { isEnabled: notificationsEnabled } = useNotifications();
  const { socket, onlineUsers, connectionStatus } = useSocket();

  const filteredChats = chats.filter((chat) => {
    const otherUser = chat.participants.find((p) => p._id !== user._id);
    return (
      otherUser?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherUser?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${otherUser?.firstName} ${otherUser?.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  const formatLastMessageTime = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);

    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm");
    } else if (isYesterday(messageDate)) {
      return "Yesterday";
    } else {
      return format(messageDate, "MMM dd");
    }
  };

  const getLastMessagePreview = (message) => {
    if (!message) return "No messages yet";

    // Handle different message types
    switch (message.messageType) {
      case "image":
        return "📷 Image";
      case "video":
        return "🎥 Video";
      case "document":
        return "📄 Document";
      case "file":
        return "📎 File";
      default: {
        // Handle emoji-only messages
        const isEmojiOnly = (text) => {
          if (typeof text !== "string") return false;
          const withoutEmojis = text.replace(/\p{Emoji}/gu, "");
          return withoutEmojis.trim().length === 0 && text.trim().length > 0;
        };

        if (isEmojiOnly(message.content)) {
          return message.content;
        }

        if (typeof message.content !== "string") return "";
        return message.content.length > 50
          ? message.content.substring(0, 50) + "..."
          : message.content;
      }
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
          {/* User Profile */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold shadow-lg text-sm sm:text-base dark:bg-blue-900 dark:text-blue-400">
                  {user?.avatar ? (
                    <>
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className="hidden w-full h-full rounded-full flex items-center justify-center text-blue-700 dark:text-blue-100 text-base sm:text-lg font-bold">
                        {`${user?.firstName?.charAt(0) || ""}${
                          user?.lastName?.charAt(0) || ""
                        }`.toUpperCase()}
                      </div>
                    </>
                  ) : user?.photos && user.photos.length > 0 ? (
                    <>
                      <img
                        src={getImageUrl(user.photos[0])}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    </>
                  ) : (
                    // <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    <div className="hidden w-full h-full rounded-full flex items-center justify-center text-blue-700 dark:text-blue-100 text-base sm:text-lg font-bold">
                      {`${user?.firstName?.charAt(0) || ""}${
                        user?.lastName?.charAt(0) || ""
                      }`.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white dark:bg-blue-400"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-black dark:text-white text-base sm:text-lg truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full dark:bg-blue-400"></div>
                  <p className="text-xs sm:text-sm text-black dark:text-gray-300 font-medium">
                    Active now
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onShowNotificationSettings(true)}
                className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800`}
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onShowUserSearch(true)}
                className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl dark:bg-blue-900 dark:hover:bg-blue-800"
                title="New Chat"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-white dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 transition-all duration-200 placeholder-gray-500 text-sm sm:text-base text-black dark:text-white"
            />
          </div>
        </div>
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto chat-scroll bg-white dark:bg-gray-800 transition-colors duration-300">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 sm:mb-6 dark:bg-blue-900">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2 text-center">
                {searchTerm ? "No chats found" : "Start a conversation"}
              </h3>
              <p className="text-center text-black dark:text-gray-300 mb-4 sm:mb-6 max-w-xs text-sm sm:text-base">
                {searchTerm
                  ? "Try searching with a different name"
                  : "Connect with someone special and start chatting"}
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onShowUserSearch(true)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base dark:bg-blue-900 dark:hover:bg-blue-800"
                >
                  Find People
                </motion.button>
              )}
            </div>
          ) : (
            <div className="p-2 sm:p-3 space-y-1">
              {filteredChats.map((chat) => {
                const otherUser = chat.participants.find(
                  (p) => p._id !== user._id
                );
                const isSelected = selectedChat?._id === chat._id;
                const isOtherUserOnline = otherUser
                  ? onlineUsers.includes(otherUser._id)
                  : false;
                return (
                  <motion.div
                    key={chat._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChatSelect(chat)}
                    className={`flex items-center p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 border border-gray-100 dark:border-gray-700 ${
                      isSelected
                        ? "bg-green-50 border-green-500 shadow-md dark:bg-green-900 dark:border-green-400"
                        : "hover:bg-blue-50 hover:shadow-sm dark:hover:bg-blue-800"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm sm:text-lg shadow-lg dark:bg-blue-900">
                        {otherUser &&
                        (otherUser.avatar ||
                          (otherUser.photos && otherUser.photos.length > 0)) ? (
                          <>
                            <img
                              src={
                                otherUser.avatar
                                  ? otherUser.avatar
                                  : getImageUrl(otherUser.photos[0])
                              }
                              alt={
                                otherUser.firstName
                                  ? `${otherUser.firstName} ${
                                      otherUser.lastName || ""
                                    }`
                                  : "User"
                              }
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          </>
                        ) : (
                          <div className="hidden w-full h-full rounded-full flex items-center justify-center text-blue-700 dark:text-blue-100 text-base sm:text-lg font-bold">
                            {(
                              otherUser?.firstName?.charAt(0) ||
                              otherUser?.email?.charAt(0) ||
                              "U"
                            ).toUpperCase()}
                          </div>
                          // <User className="w-6 h-6 text-blue-400 opacity-70 dark:text-blue-400" />
                        )}
                      </div>
                      {isOtherUserOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white dark:bg-blue-400"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 ml-3 sm:ml-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-black dark:text-white text-sm sm:text-base truncate">
                          {otherUser?.firstName} {otherUser?.lastName}
                        </h4>
                        <span className="text-xs text-black dark:text-gray-300 flex-shrink-0 ml-2">
                          {formatLastMessageTime(chat.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-black dark:text-gray-300 truncate">
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
