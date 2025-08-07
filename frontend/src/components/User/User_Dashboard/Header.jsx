import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/Chat/AuthContext";
import { getImageUrl } from "../../../utils/imageUtils";
// import userProfile from "../../../../../../assets/userprofile/user.png";
import userProfile from "../../../../public/assets/userprofile/user.png";

import { useTheme } from "../../../contexts/ThemeContext";
import { useSocket } from "../../../contexts/Chat/SocketContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications } from "../../../services/notificationService";
import { searchUsers } from "../../../services/userService";
import NotificationList from "../../NotificationList";
import NotificationPopup from "../../NotificationPopup";
import { Bell } from "lucide-react";

function Header({ onMenuClick }) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [popupNotification, setPopupNotification] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Refs for dropdowns
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });
  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  // Debounce for search suggestions
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user menu
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }

      // Close notification dropdown
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (query) => {
    try {
      const results = await searchUsers(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSearchResults([]);
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setShowSuggestions(true);
        setShowMobileSearch(false);
      } catch (error) {
        console.error("Error performing search:", error);
        setSearchResults([]);
      }
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on("new-notification", (notification) => {
        setPopupNotification(notification);
        queryClient.invalidateQueries("notifications");
      });

      return () => {
        socket.off("new-notification");
      };
    }
  }, [socket, queryClient]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 shadow-sm h-16 flex items-center">
      {popupNotification && (
        <NotificationPopup
          notification={popupNotification}
          onClose={() => setPopupNotification(null)}
        />
      )}
      <div className="flex items-center justify-between w-full max-w-full mx-auto h-16">
        {/* Left Side: Menu, Logo, Search */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 sm:gap-3 text-lg lg:text-xl font-bold"
          >
            {/* <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
              <span className="text-white text-xl lg:text-2xl">❤️</span>
            </div> */}
            <img
              src="../../../../../public/assets/image.png"
              alt=""
              srcSet=""
              className="h-[50px] rounded-[50px]"
            />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block font-extrabold tracking-tight">
              MatroMatch
            </span>
          </Link>

          {/* Mobile Search Icon */}
          <div className="flex md:hidden items-center justify-center relative">
            {!showMobileSearch && (
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open search"
                onClick={() => setShowMobileSearch(true)}
              >
                <svg
                  className="h-6 w-6 text-gray-500 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 21l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
            {showMobileSearch && (
              <div
                className="absolute left-0 top-0 w-64 max-w-[80vw] bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col border border-gray-200 dark:border-gray-700 animate-fade-in z-50"
                ref={searchInputRef}
              >
                <div className="flex items-center px-3 py-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search Profiles..."
                    className="border-none bg-transparent outline-none text-sm flex-1 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />
                  <button
                    className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close search"
                    onClick={() => setShowMobileSearch(false)}
                  >
                    <svg
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {showSuggestions && (
                  <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                    {searchResults.length > 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-semibold mb-1">Search Results:</p>
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            className="py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => {
                              setSearchQuery(
                                `${user.firstName} ${user.lastName}`
                              );
                              setShowSuggestions(false);
                              navigate(`/profile/${user._id}`);
                            }}
                          >
                            {user.firstName} {user.lastName}
                            {user.city && `, ${user.city}`}
                          </div>
                        ))}
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-semibold mb-1">Suggestions:</p>
                        {suggestions.map((user) => (
                          <div
                            key={user._id}
                            className="py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => {
                              setSearchQuery(
                                `${user.firstName} ${user.lastName}`
                              );
                              setShowSuggestions(false);
                              navigate(`/profile/${user._id}`);
                            }}
                          >
                            {user.firstName} {user.lastName}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        No results found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex relative flex-col" ref={searchInputRef}>
          <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-full px-4 lg:px-5 py-2 lg:py-3 gap-3 min-w-[250px] lg:min-w-[300px] border border-gray-200 dark:border-gray-700 focus-within:border-blue-300 focus-within:bg-white dark:focus-within:bg-gray-700 transition-all">
            <span className="text-gray-400 dark:text-gray-500 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search Profiles..."
              className="border-none bg-transparent outline-none text-sm flex-1 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 mt-2 z-50">
              {searchResults.length > 0 ? (
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold mb-1">Search Results:</p>
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setSearchQuery(`${user.firstName} ${user.lastName}`);
                        setShowSuggestions(false);
                        navigate(`/profile/${user._id}`);
                      }}
                    >
                      {user.firstName} {user.lastName}
                      {user.city && `, ${user.city}`}
                    </div>
                  ))}
                </div>
              ) : suggestions.length > 0 ? (
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold mb-1">Suggestions:</p>
                  {suggestions.map((user) => (
                    <div
                      key={user._id}
                      className="py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setSearchQuery(`${user.firstName} ${user.lastName}`);
                        setShowSuggestions(false);
                        navigate(`/profile/${user._id}`);
                      }}
                    >
                      {user.firstName} {user.lastName}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  No results found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Navigation, Icons, User */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Navigation */}
          <nav className="hidden lg:flex gap-4 items-center">
            <Link
              to="/feed"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Match
            </Link>

            <Link
              to="/settings?tab=subscription"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              Plans
            </Link>
          </nav>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 5a7 7 0 100 14 7 7 0 000-14z"
                />
              </svg>
            )}
          </button>

          {/* Message Icon */}
          <Link
            to="/chat"
            className="relative p-2 rounded-full hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </Link>

          {/* Notification Icon */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Bell className="h-6 w-6 text-yellow-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-xs text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && <NotificationList />}
          </div>

          {/* User Avatar with Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 transition-colors">
                <img
                  src={getImageUrl(user?.photos?.[0]) || user?.avatar || userProfile}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user ? `${user.firstName}` : "User"}
              </span>
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user ? `${user.firstName} ${user.lastName}` : "User Name"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
