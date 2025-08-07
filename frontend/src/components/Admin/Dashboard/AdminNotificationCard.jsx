import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Bell,
  Users,
  Shield,
  AlertTriangle,
  FileText,
  CreditCard,
  Lock,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

const AdminNotificationCard = () => {
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const [showAll, setShowAll] = useState(false);
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
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: fetchAdminNotifications,
    refetchInterval: 10000, // Refetch every 10 seconds
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
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const clearAllNotifications = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/notifications/clear-all`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      queryClient.invalidateQueries(["admin-notifications"]);
      toast.success("All notifications cleared successfully");
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      toast.error("Failed to clear all notifications");
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
        return <Users className="w-6 h-6 text-blue-500" />;
      case "admin_verification_request":
        return <Shield className="w-6 h-6 text-orange-500" />;
      case "admin_suspicious_activity":
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case "admin_user_report":
        return <FileText className="w-6 h-6 text-purple-500" />;
      case "admin_system_alert":
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case "admin_payment_issue":
        return <CreditCard className="w-6 h-6 text-red-500" />;
      case "admin_high_traffic":
        return <Users className="w-6 h-6 text-green-500" />;
      case "admin_security_breach":
        return <Lock className="w-6 h-6 text-red-600" />;
      case "admin_subscription_expiry":
        return <Calendar className="w-6 h-6 text-orange-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayNotifications = showAll
    ? notifications
    : notifications.slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading notifications...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-32">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <span className="ml-3 text-red-600 dark:text-red-400">
            Failed to load notifications
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Latest Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Clear All
              </button>
            )}
            {notifications.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showAll ? "Show Less" : "Show All"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              New notifications will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`border-l-4 p-4 rounded-lg shadow-sm ${getNotificationColor(
                  notification.type
                )} ${!notification.isRead ? "ring-2 ring-blue-200" : ""}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-3">
                      {formatDate(notification.createdAt)}
                    </p>

                    {/* Expanded Details */}
                    {expandedNotifications[notification._id] && (
                      <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Details
                        </h5>
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
                          <div className="mt-4">
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

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 mt-4">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark as read</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationCard;
