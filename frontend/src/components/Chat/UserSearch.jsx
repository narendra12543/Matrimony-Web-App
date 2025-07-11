import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Plus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserSearch = ({ isOpen, onClose, onChatCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  console.log(users);
  

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('UserSearch: Searching with token:', !!token);
      
      const response = await axios.get(`http://localhost:5000/api/v1/chat/users/search?query=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      if (error.response?.status === 401) {
        console.error('Auth error in user search');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('UserSearch: Creating chat with token:', !!token);
      
      const response = await axios.post('http://localhost:5000/api/v1/chat', {
        participantId: userId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      onChatCreate(response.data);
      onClose();
      toast.success('Chat started!');
    } catch (error) {
      console.error('Error creating chat:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else {
        toast.error('Failed to start chat');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Start New Chat</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 chat-scroll">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">Searching...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">
                {searchTerm ? 'No users found' : 'Start typing to search'}
              </h4>
              <p className="text-gray-500">
                {searchTerm ? 'Try a different search term' : 'Enter a name or email to find people'}
              </p>
            </div>
          ) : (
            users.map((user, index) => (
              <motion.div
                key={user._doc._id || `user-${index}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200"
                onClick={() => handleCreateChat(user._doc._id)}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {user._doc.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={`${user._doc.firstName} ${user._doc.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      `${user._doc.firstName?.charAt(0) || ''}${user._doc.lastName?.charAt(0) || ''}`.toUpperCase()
                    )}
                  </div>
                  {user.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-bold text-gray-900 text-lg">{user._doc.firstName} {user._doc.lastName}</p>
                  <p className="text-sm text-gray-600">{user._doc.email}</p>
                </div>
                <div className="ml-4">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-rose-600" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserSearch;
