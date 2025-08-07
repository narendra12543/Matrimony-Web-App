import React, { useState, useEffect } from "react";
import {
  getTotalUsers,
  getMaleUsers,
  getFemaleUsers,
  getPremiumUsers,
  getRecentUsers,
  searchUsersAdmin,
} from "../../../services/adminService";
import {
  Users,
  UserCheck2,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  Crown,
  Menu,
  X,
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  UserX,
  AlertTriangle,
  Star,
  UserMinus,
  Tag,
  User,
  LogOut,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import AdminFeedbackPage from "../../../pages/AdminFeedbackPage";
import InactiveUser from "../InactiveUser/InactiveUser";
import AdminNotificationCard from "./AdminNotificationCard";

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [maleUsers, setMaleUsers] = useState(0);
  const [femaleUsers, setFemaleUsers] = useState(0);
  const [premiumUsers, setPremiumUsers] = useState(0);
  const [recentUsers, setRecentUsers] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [total, male, female, premium, recent] = await Promise.all([
          getTotalUsers(),
          getMaleUsers(),
          getFemaleUsers(),
          getPremiumUsers(),
          getRecentUsers(),
        ]);
        setTotalUsers(total);
        setMaleUsers(male);
        setFemaleUsers(female);
        setPremiumUsers(premium);
        setRecentUsers(recent);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim() !== "") {
        setSearchLoading(true);
        try {
          const users = await searchUsersAdmin(searchTerm);
          setSearchedUsers(users);
        } catch (error) {
          setSearchedUsers([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchedUsers([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const statsCards = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      title: "Female Users",
      value: femaleUsers.toLocaleString(),
      icon: UserCheck2,
      color: "bg-green-500",
      change: "+8%",
    },
    {
      title: "Total Premium Users",
      value: premiumUsers.toLocaleString(),
      icon: Crown,
      color: "bg-purple-500",
      change: "+25%",
    },
    {
      title: "Male Users",
      value: maleUsers.toLocaleString(),
      icon: User,
      color: "bg-red-500",
      change: "-5%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading dashboard data...
            </p>
          </div>
        </div>
      )}

      {/* Latest Notifications */}
      <AdminNotificationCard />

      {/* Dashboard Content */}
      {!isLoading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((card, index) => (
              <div
                key={index}
                className={`${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } rounded-xl p-6 border hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      } font-medium`}
                    >
                      {card.title}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      } mt-1`}
                    >
                      {card.value}
                    </p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-sm font-medium text-green-600">
                    {card.change}
                  </span>
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    } ml-2`}
                  >
                    vs last month
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recently Registered Users and Search - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recently Registered Users */}
            <div
              className={`${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } rounded-xl border`}
            >
              <div
                className={`p-6 ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                } border-b`}
              >
                <h3
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Recently Registered Users
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div
                      key={user._id}
                      className={`flex items-center space-x-4 p-4 ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-50"
                      } rounded-lg`}
                    >
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {user.firstName} {user.lastName}
                        </p>
                        <p
                          className={`text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {user.email}
                        </p>
                      </div>
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Users */}
            <div
              className={`${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } rounded-xl border`}
            >
              <div
                className={`p-6 ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                } border-b`}
              >
                <h3
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Search Users
                </h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="relative">
                    <Search
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? "text-gray-400" : "text-gray-400"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    />
                  </div>
                </div>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {searchLoading ? (
                    <div className="text-center py-4 text-gray-400 dark:text-gray-300">
                      Searching...
                    </div>
                  ) : searchedUsers.length > 0 ? (
                    searchedUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`flex items-center space-x-4 p-4 ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-50"
                        } rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600`}
                        onClick={() => navigate(`/admin/users/${user._id}`)}
                      >
                        <div className="bg-indigo-100 p-2 rounded-full">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {user.firstName} {user.lastName}
                          </p>
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : searchTerm && !searchLoading ? (
                    <div className="text-center py-4">
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No users found matching "{searchTerm}"
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Start typing to search for users.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
