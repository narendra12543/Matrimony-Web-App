import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/Chat/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ProfileCompletion() {
  const { user } = useAuth();
  const [completion, setCompletion] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?._id) {
      fetchCompletion();
    }
    // eslint-disable-next-line
  }, [user?._id]);

  const fetchCompletion = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/v1/users/profile-completion/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompletion(res.data.completion);
      setMissingFields(res.data.missingFields);
    } catch (err) {
      setError('Failed to fetch profile completion.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldClick = (field) => {
    navigate(`/profile/edit?focus=${field}`);
  };

  // Example mapping for some common fields
  const fieldLabels = {
    photos: 'Upload More Photos',
    partnerPreferences: 'Add Partner Preferences',
    isVerified: 'Verify Email/Phone',
    aboutMe: 'Add About Me',
    // Add more mappings as needed
  };

  return (
    <section className="bg-white rounded-2xl p-4 lg:p-8 shadow-lg w-full h-full border border-gray-100">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6 flex items-center gap-3">
        <span className="text-xl lg:text-2xl">🎯</span>
        Profile Completion
      </h2>

      {/* Progress Bar */}
      <div className="w-full h-2 lg:h-3 bg-gray-200 rounded-full mb-4 lg:mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 relative"
          style={{ width: `${completion}%` }}
        >
          <div className="absolute right-0 top-0 h-full w-1 lg:w-2 bg-white opacity-30 animate-pulse"></div>
        </div>
      </div>
      <div className="text-center mb-4 lg:mb-6">
        <span className="text-xl lg:text-2xl font-bold text-gray-800">{completion}%</span>
        <span className="text-gray-500 ml-2 text-sm lg:text-base">Complete</span>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="flex flex-col gap-3 lg:gap-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 pr-1">
          {missingFields.length === 0 ? (
            <div className="text-green-600 font-semibold text-center">Profile is complete!</div>
          ) : (
            missingFields.map((field, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleFieldClick(field)}
                className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-blue-50 transition-all duration-300 hover:scale-102 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <span className="text-xl lg:text-2xl w-6 lg:w-8 text-center text-orange-500">⚠️</span>
                <span className="text-sm lg:text-base text-gray-700 font-medium flex-1">
                  {fieldLabels[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <span className="text-gray-400 text-sm lg:text-base">→</span>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default ProfileCompletion;
