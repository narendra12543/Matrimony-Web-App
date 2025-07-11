import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/Chat/AuthContext';
import userProfile from '../../../assets/userprofile/user.png';

function Header({ onMenuClick }) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 lg:px-6 shadow-sm h-16 flex items-center">
      <div className="flex items-center justify-between w-full max-w-full mx-auto h-16">
        {/* Left Side: Menu, Logo, Search */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 lg:gap-3 text-lg lg:text-xl font-bold">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
              <span className="text-white text-xl lg:text-2xl">❤️</span>
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block font-extrabold tracking-tight">
              HeartConnect
            </span>
          </Link>

          {/* Mobile Search Icon */}
          <div className="flex md:hidden items-center justify-center relative">
            {!showMobileSearch && (
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Open search"
                onClick={() => setShowMobileSearch(true)}
              >
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {showMobileSearch && (
              <div className="absolute left-0 top-0 w-64 max-w-[80vw] bg-white rounded-full shadow-lg flex items-center px-3 py-2 border border-gray-200 animate-fade-in z-50">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search Profiles..."
                  className="border-none bg-transparent outline-none text-sm flex-1 placeholder-gray-400"
                />
                <button
                  className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close search"
                  onClick={() => setShowMobileSearch(false)}
                >
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex items-center bg-gray-50 rounded-full px-4 lg:px-5 py-2 lg:py-3 gap-3 min-w-[250px] lg:min-w-[300px] border border-gray-200 focus-within:border-blue-300 focus-within:bg-white transition-all">
          <span className="text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search Profiles..."
            className="border-none bg-transparent outline-none text-sm flex-1 placeholder-gray-400"
          />
        </div>

        {/* Right Side: Navigation, Icons, User */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Quick Navigation */}
          <nav className="hidden lg:flex gap-4 items-center">
            <Link to="/feed" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Feed
            </Link>
            <Link to="/chat" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Chat
            </Link>
            <Link to="/plans" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Plans
            </Link>
          </nav>

          {/* Message Icon */}
          <Link to="/chat" className="relative p-2 rounded-full hover:bg-blue-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </Link>

          {/* Notification Icon */}
          <button className="relative p-2 rounded-full hover:bg-blue-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* User Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 overflow-hidden rounded-full border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <img src={user?.avatar || userProfile} alt="User" className="w-full h-full object-cover" />
              </div>
              <span className="hidden lg:block text-sm font-medium text-gray-700">
                {user ? `${user.firstName}` : 'User'}
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user ? `${user.firstName} ${user.lastName}` : 'User Name'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link
                  to="/profile/create"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profile Settings
                </Link>
                <Link
                  to="/verification"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  Verification
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close user menu when clicking outside */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}

export default Header;
