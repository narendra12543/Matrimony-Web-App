import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getNotifications, markAsRead, markAllAsRead, clearAllNotifications, deleteNotification } from '../services/notificationService';
import { Trash2, X } from 'lucide-react';

const NotificationList = () => {
  const { data: notifications, refetch } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });
  const queryClient = useQueryClient();

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    queryClient.invalidateQueries(['notifications']);
  };

  const handleDeleteNotification = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteNotification(id);
      queryClient.invalidateQueries(['notifications']);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      queryClient.invalidateQueries(['notifications']);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
      <div className="py-2">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="font-bold text-lg text-gray-900 dark:text-white">Notifications</div>
          <button
            onClick={handleClearAll}
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline transition-colors"
          >
            Clear All
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications?.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`relative group hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Link
                  to={notification.link}
                  onClick={() => handleMarkAsRead(notification._id)}
                  className="block px-4 py-3 text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className={`font-semibold ${
                        notification.isRead 
                          ? 'text-gray-600 dark:text-gray-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title}
                      </div>
                      <div className={`mt-1 ${
                        notification.isRead 
                          ? 'text-gray-500 dark:text-gray-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.message}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      className="ml-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute top-3 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </Link>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No notifications
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationList;
