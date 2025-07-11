import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/Chat/AuthContext';
import userProfile from '../../../assets/userprofile/profile.png';
import axios from 'axios';

function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [matches, setMatches] = React.useState(0);
  const [interests, setInterests] = React.useState(0);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !user._id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/v1/users/${user._id}`);
        setProfile(response.data);
        // Optionally fetch matches and interests if you have endpoints for them
        // For now, use dummy values or extract from response if available
        setMatches(response.data.matches?.length || 8); // fallback to 8
        setInterests(response.data.interests?.length || 45); // fallback to 45
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { icon: '🏠', text: 'Dashboard', to: '/dashboard', active: location.pathname === '/dashboard' },
    { icon: '💳', text: 'Subscription Plans', to: '/plans', active: location.pathname === '/plans' },
    { icon: '📰', text: 'Feed Page', to: '/feed', active: location.pathname === '/feed' },
    { icon: '💬', text: 'Chat Page', to: '/chat', active: location.pathname === '/chat' },
    { icon: '✏️', text: 'Profile Page', to: '/profile/create', active: location.pathname.includes('/profile') },
    { icon: '✅', text: 'Verification', to: '/verification', active: location.pathname === '/verification' },
  ];

  return (
    <aside className="w-[280px] lg:w-[300px] bg-white border-r border-gray-200 py-6 lg:py-8 px-4 lg:px-6 shadow-lg h-full overflow-y-auto scrollbar-hide">

      {/* Mobile Close Button */}
      <div className="lg:hidden flex mt-[-25px] justify-end mb-4">
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
          aria-label="Close menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Profile Section */}
      <div className="text-center mb-8 lg:mb-10">
        <div className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4 relative">
          <img
            src={profile?.photos?.[0] || user?.avatar || userProfile}
            alt="User"
            className="w-full h-full object-cover rounded-full border-4 border-blue-100"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-1">
          {user ? `${user.firstName} ${user.lastName}` : 'User Name'}
        </h2>
        <p className="text-xs lg:text-sm text-blue-600 mb-4 lg:mb-6 font-semibold bg-blue-50 px-2 lg:px-3 py-1 rounded-full inline-block">
          {profile?.subscription?.isActive && profile?.subscription?.planName
            ? profile.subscription.planName
            : 'Free Member'}
        </p>

        <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-6">
          {loading ? (
            <div className="col-span-3 text-center text-gray-400">Loading stats...</div>
          ) : (
            [
              { number: profile?.profileViews ?? 0, label: 'Profile Views' },
              { number: matches, label: 'Matches' },
              { number: interests, label: 'Interests' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-2 lg:p-3 bg-gray-50 rounded-xl">
                <span className="text-sm lg:text-lg font-bold text-gray-800">{stat.number}</span>
                <span className="text-xs text-gray-600 text-center leading-tight">{stat.label}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-col gap-1 lg:gap-2 mb-6">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.to}
            className={`flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 lg:py-4 rounded-xl transition-all text-sm font-medium group ${
              item.active
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
            onClick={onClose}
          >
            <span className="text-base lg:text-lg w-5 lg:w-6 text-center group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="truncate">{item.text}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 lg:py-4 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all group"
        >
          <span className="text-base lg:text-lg w-5 lg:w-6 text-center group-hover:scale-110 transition-transform">🚪</span>
          <span className="truncate">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
