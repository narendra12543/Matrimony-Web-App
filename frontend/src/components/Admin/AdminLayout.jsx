import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  Settings,
  Crown,
  Menu,
  X,
  Bell,
  Search,
  AlertTriangle,
  Star,
  UserMinus,
  Tag,
  LogOut,
  Moon,
  Sun,
  Users,
  CheckCircle,
  UserCheck,
  Mail,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  CreditCard, // Add this import for subscription icon
} from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";

const AdminLayout = ({ children, title = "Admin Dashboard" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const notificationRef = useRef(null);

  // Handle clicking outside notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationDropdownOpen(false);
      }
    };

    if (notificationDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationDropdownOpen]);

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

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: fetchAdminNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
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
        return <Users className="w-4 h-4 text-blue-500" />;
      case "admin_verification_request":
        return <CheckCircle className="w-4 h-4 text-orange-500" />;
      case "admin_suspicious_activity":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "admin_user_report":
        return <AlertTriangle className="w-4 h-4 text-purple-500" />;
      case "admin_system_alert":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "admin_payment_issue":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "admin_high_traffic":
        return <Users className="w-4 h-4 text-green-500" />;
      case "admin_security_breach":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "admin_subscription_expiry":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const sidebarItems = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      path: "/admin/dashboard",
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      path: "/admin/users",
    },
    {
      id: "new-user-approvals",
      label: "New User Approvals",
      icon: UserPlus,
      path: "/admin/new-user-approvals",
    },
    {
      id: "profile-approvals",
      label: "Profile Change Approvals",
      icon: UserCheck,
      path: "/admin/profile-approvals",
    },
    {
      id: "verifications",
      label: "Pending Verifications",
      icon: CheckCircle,
      path: "/admin/verifications",
    },
    {
      id: "inactive-users",
      label: "Inactive User Management",
      icon: UserMinus,
      path: "/admin/inactive-users",
    },
    {
      id: "email",
      label: "Email Management",
      icon: Mail,
      path: "/admin/email",
    },
    { id: "feedback", label: "Feedback", icon: Star, path: "/admin/feedback" },
    {
      id: "coupons",
      label: "Coupon Management",
      icon: Tag,
      path: "/admin/coupons",
    },
    {
      id: "subscriptions",
      label: "Product Plans",
      icon: CreditCard,
      path: "/admin/subscriptions",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin/signin", { replace: true });
  };

  const handleNavigation = (item) => {
    setSidebarOpen(false);
    navigate(item.path);
  };

  const getCurrentActiveTab = () => {
    const { pathname } = location;
    if (pathname.startsWith("/admin/email")) return "email";
    if (pathname.startsWith("/admin/feedback")) return "feedback";
    if (pathname.startsWith("/admin/inactive-users")) return "inactive-users";
    if (pathname.startsWith("/admin/users")) return "users";
    if (pathname.startsWith("/admin/reports")) return "reports";
    if (pathname.startsWith("/admin/settings")) return "settings";
    if (pathname.startsWith("/admin/coupons")) return "coupons";
    if (pathname.startsWith("/admin/verifications")) return "verifications";
    if (pathname.startsWith("/admin/new-user-approvals"))
      return "new-user-approvals";
    if (pathname.startsWith("/admin/profile-approvals"))
      return "profile-approvals";
    if (pathname.startsWith("/admin/subscriptions"))
      return "subscriptions";
    return "overview";
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Mobile Header */}
      <div
        className={`lg:hidden ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border-b px-4 py-3 flex items-center justify-between`}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-indigo-600" />
            <h1
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Admin Panel
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <div className="relative">
            <button
              onClick={() =>
                setNotificationDropdownOpen(!notificationDropdownOpen)
              }
              className={`p-2 rounded-lg ${
                isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              } relative`}
            >
              <Bell
                className={`w-5 h-5 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Mobile Notification Dropdown */}
            {notificationDropdownOpen && (
              <div
                ref={notificationRef}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  <p className="text-sm text-gray-500">{unreadCount} unread</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-3 border-b border-gray-100 dark:border-gray-700 ${
                          !notification.isRead
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-r transition-transform duration-300 ease-in-out`}
        >
          {/* Sidebar Header */}
          <div
            className={`hidden lg:flex items-center justify-between p-6 ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            } border-b`}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h1
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Admin Panel
              </h1>
            </div>
          </div>

          {/* Mobile Sidebar Header */}
          <div
            className={`lg:hidden flex items-center justify-between p-4 ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            } border-b`}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h1
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Admin Panel
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-2 rounded-lg ${
                isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2 flex-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  getCurrentActiveTab() === item.id
                    ? isDarkMode
                      ? "bg-indigo-900 text-indigo-300 border-r-2 border-indigo-500"
                      : "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500"
                    : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Theme Toggle and Logout */}
          <div
            className={`p-4 space-y-2 ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            } border-t`}
          >
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                isDarkMode
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              <span className="font-medium">
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div
            className={`hidden lg:block ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } border-b px-6 py-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {title}
                </h2>
                <p
                  className={`${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Manage your matrimonial platform
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? "text-gray-400" : "text-gray-400"
                    } w-5 h-5`}
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    className={`pl-10 pr-4 py-2 border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white"
                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  />
                </div>
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Desktop Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setNotificationDropdownOpen(!notificationDropdownOpen)
                    }
                    className={`p-2 rounded-lg ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    } relative`}
                  >
                    <Bell
                      className={`w-5 h-5 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop Notification Dropdown */}
                  {notificationDropdownOpen && (
                    <div
                      ref={notificationRef}
                      className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notifications
                          </h3>
                          <span className="text-sm text-gray-500">
                            {unreadCount} unread
                          </span>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No notifications
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 border-b border-gray-100 dark:border-gray-700 ${
                                !notification.isRead
                                  ? "bg-blue-50 dark:bg-blue-900/20"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                {getNotificationIcon(notification.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {notification.title}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                      {!notification.isRead && (
                                        <button
                                          onClick={() =>
                                            markAsRead(notification._id)
                                          }
                                          className="text-blue-600 hover:text-blue-800"
                                          title="Mark as read"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          deleteNotification(notification._id)
                                        }
                                        className="text-red-600 hover:text-red-800"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {formatDate(notification.createdAt)}
                                  </p>

                                  {/* Expanded Details */}
                                  {expandedNotifications[notification._id] &&
                                    notification.data && (
                                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                          Details
                                        </h4>
                                        <div className="space-y-1">
                                          {Object.entries(
                                            notification.data
                                          ).map(([key, value]) => (
                                            <div
                                              key={key}
                                              className="flex justify-between text-xs"
                                            >
                                              <span className="text-gray-600 dark:text-gray-400 capitalize">
                                                {key
                                                  .replace(/([A-Z])/g, " $1")
                                                  .trim()}
                                                :
                                              </span>
                                              <span className="text-gray-900 dark:text-white font-medium">
                                                {typeof value === "object"
                                                  ? JSON.stringify(value)
                                                  : String(value)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  {notification.data && (
                                    <button
                                      onClick={() =>
                                        toggleExpanded(notification._id)
                                      }
                                      className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                                    >
                                      {expandedNotifications[
                                        notification._id
                                      ] ? (
                                        <span className="flex items-center">
                                          Hide details{" "}
                                          <ChevronUp className="w-3 h-3 ml-1" />
                                        </span>
                                      ) : (
                                        <span className="flex items-center">
                                          Show details{" "}
                                          <ChevronDown className="w-3 h-3 ml-1" />
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
