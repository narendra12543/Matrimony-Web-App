import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import FileMessage from './FileMessage';

const MessageList = ({ messages, currentUserId }) => {
  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`;
    } else {
      return format(messageDate, 'MMM dd, HH:mm');
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  const formatDateSeparator = (date) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return 'Today';
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMMM dd, yyyy');
    }
  };

  const isEmojiOnly = (text) => {
    // Remove all emojis and check if anything remains
    const withoutEmojis = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    return withoutEmojis.trim().length === 0 && text.trim().length > 0;
  };

  // Filter out temporary messages that have been replaced by real ones
  const filteredMessages = messages.filter((message, index, arr) => {
    if (message.isTemp) {
      // Check if there's a real message with the same content and sender
      const hasRealMessage = arr.some(msg => 
        !msg.isTemp && 
        msg.content === message.content && 
        msg.sender._id === message.sender._id &&
        Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 10000 // Within 10 seconds
      );
      return !hasRealMessage;
    }
    return true;
  });

  return (
    <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 chat-scroll">
      {filteredMessages.map((message, index) => {
        const isOwnMessage = message.sender._id === currentUserId;
        const previousMessage = filteredMessages[index - 1];
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
        const emojiOnly = message.messageType === 'text' && isEmojiOnly(message.content);
        const isFileMessage = ['image', 'video', 'document', 'file'].includes(message.messageType);

        return (
          <div key={message._id}>
            {/* Date Separator */}
            {showDateSeparator && (
              <div className="flex justify-center my-3 sm:my-4">
                <span className="px-2 sm:px-3 py-1 bg-rose-100 text-rose-600 text-xs rounded-full font-medium">
                  {formatDateSeparator(message.createdAt)}
                </span>
              </div>
            )}

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1 sm:mb-2`}
            >
              <div className={`flex items-end space-x-1 sm:space-x-2 max-w-[280px] sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''} ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
                {/* Avatar */}
                {!isOwnMessage && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0 shadow-sm">
                    {message.sender.avatar ? (
                      <img 
                        src={message.sender.avatar} 
                        alt={message.sender.firstName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      (message.sender?.firstName?.charAt(0) || message.sender?.email?.charAt(0) || 'U').toUpperCase()
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div className={`relative ${
                  isFileMessage || emojiOnly 
                    ? 'bg-transparent p-1' 
                    : `px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                        isOwnMessage 
                          ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md' 
                          : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                      }`
                } ${message.isTemp ? 'opacity-70' : ''}`}>
                  
                  {/* Temporary message indicator */}
                  {message.isTemp && (
                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  )}

                  {isFileMessage ? (
                    <FileMessage message={message} isOwnMessage={isOwnMessage} />
                  ) : (
                    <p className={`${emojiOnly ? 'text-2xl sm:text-4xl' : 'text-xs sm:text-sm'} break-words`}>
                      {message.content}
                    </p>
                  )}
                  
                  {!emojiOnly && !isFileMessage && (
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-rose-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  )}
                </div>
                
                {/* Time for emoji-only and file messages */}
                {(emojiOnly || isFileMessage) && (
                  <div className={`text-xs text-gray-500 ${isOwnMessage ? 'text-right' : 'text-left'} mt-1`}>
                    {formatMessageTime(message.createdAt)}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
