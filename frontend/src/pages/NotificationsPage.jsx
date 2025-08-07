import { useQuery } from '@tanstack/react-query';
import { getNotifications, markAllAsRead } from '../services/notificationService';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
  const { data: notifications, refetch } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    refetch();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button onClick={handleMarkAllAsRead} className="text-sm text-blue-500 hover:underline">Mark all as read</button>
      </div>
      <div className="space-y-4">
        {notifications?.length > 0 ? (
          notifications.map((notification) => (
            <Link to={notification.link} key={notification._id} className={`block p-4 rounded-lg ${notification.isRead ? 'bg-gray-100' : 'bg-white shadow'}`}>
              <div className="font-bold">{notification.title}</div>
              <p>{notification.message}</p>
              <div className="text-xs text-gray-500 mt-2">{new Date(notification.createdAt).toLocaleString()}</div>
            </Link>
          ))
        ) : (
          <p>You have no notifications.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
