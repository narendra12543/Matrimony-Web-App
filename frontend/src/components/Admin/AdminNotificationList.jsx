import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Bell,
  User,
  Shield,
  AlertTriangle,
  FileText,
  CreditCard,
  Users,
  Lock,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

const AdminNotificationList = () => {
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const queryClient = useQueryClient();

  // Fetch admin notifications
  const fetchAdminNotifications = async () => {
    const adminToken = localStorage.getItem("adminToken");
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/v1/admin/notifications`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    return response.data;
  };

  const {
    data: notifications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: fetchAdminNotifications,
  });

  const markAsRead = async (id) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/notifications/${id}/read`,
        null,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      queryClient.invalidateQueries(["admin-notifications"]);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const deleteNotification = async (id) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/notifications/${id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      queryClient.invalidateQueries(["admin-notifications"]);
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const toggleExpanded = (notificationId) => {
    setExpandedNotifications((prev) => ({
      ...prev,
      [notificationId]: !prev[notificationId],
    }));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "admin_new_user":
        return <User className="w-5 h-5 text-blue-500" />;
      case "admin_verification_request":
        return <Shield className="w-5 h-5 text-orange-500" />;
      case "admin_suspicious_activity":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "admin_user_report":
        return <FileText className="w-5 h-5 text-purple-500" />;
      case "admin_system_alert":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "admin_payment_issue":
        return <CreditCard className="w-5 h-5 text-red-500" />;
      case "admin_high_traffic":
        return <Users className="w-5 h-5 text-green-500" />;
      case "admin_security_breach":
        return <Lock className="w-5 h-5 text-red-600" />;
      case "admin_subscription_expiry":
        return <Calendar className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "admin_suspicious_activity":
      case "admin_security_breach":
      case "admin_payment_issue":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
      case "admin_high_traffic":
      case "admin_system_alert":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "admin_new_user":
      case "admin_verification_request":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "admin_user_report":
        return "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20";
      case "admin_subscription_expiry":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20";
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Admin Notifications
        </h2>
        <span className="text-sm text-gray-500">
          {notifications?.length || 0} notifications
        </span>
      </div>

      {notifications?.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No admin notifications yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`border-l-4 p-4 rounded-lg shadow-sm ${getNotificationColor(
                notification.type
              )} ${!notification.isRead ? "ring-2 ring-blue-200" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            New
                          </span>
                        )}
                        <button
                          onClick={() => toggleExpanded(notification._id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {expandedNotifications[notification._id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(notification.createdAt)}
                    </p>

                    {/* Expanded Details */}
                    {expandedNotifications[notification._id] && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Details
                        </h4>
                        {notification.data && (
                          <div className="space-y-2">
                            {Object.entries(notification.data).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}:
                                  </span>
                                  <span className="text-gray-900 dark:text-white font-medium">
                                    {typeof value === "object"
                                      ? JSON.stringify(value)
                                      : String(value)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                        {notification.link && (
                          <div className="mt-3">
                            <a
                              href={notification.link}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            >
                              View Details →
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationList;
