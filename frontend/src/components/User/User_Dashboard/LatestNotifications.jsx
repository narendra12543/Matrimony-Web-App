import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../../../services/notificationService";
import { Link } from "react-router-dom";

const LatestNotifications = () => {
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    select: (data) => data.slice(0, 5),
  });

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 dark:text-white p-4 rounded-lg shadow">
      <h3 className="font-bold text-lg mb-2">Latest Notifications</h3>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <Link
            to={notification.link}
            key={notification._id}
            className="block text-sm text-gray-600 dark:text-white hover:text-gray-800"
          >
            <span className="font-semibold">{notification.title}</span>:{" "}
            {notification.message}
          </Link>
        ))}
      </div>
      <div className="text-right mt-4">
        <Link
          to="/notifications"
          className="text-sm text-blue-500 hover:underline"
        >
          View all
        </Link>
      </div>
    </div>
  );
};

export default LatestNotifications;
