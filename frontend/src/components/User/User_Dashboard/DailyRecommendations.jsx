import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function DailyRecommendations() {
  const [recommendation, setRecommendation] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupName, setPopupName] = useState('');
  const [popupAvatar, setPopupAvatar] = useState('');
  const navigate = useNavigate();

  // Fetch daily recommendation on mount
  useEffect(() => {
    fetchRecommendation();
    // eslint-disable-next-line
  }, []);

  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/v1/users/daily-recommendation', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendation(res.data.recommendation);
      setMatch(res.data.matchPercentage);
    } catch (err) {
      setRecommendation(null);
      setMatch(null);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to fetch recommendation.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!recommendation?._id) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/v1/users/skip', {
        skippedUserId: recommendation._id,
        recommendationId: recommendation.recommendationId,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRecommendation();
    } catch (err) {
      setError('Failed to skip recommendation.');
    }
  };

  const handleConnect = async () => {
    if (!recommendation?._id) return;
    setShowPopup(true);
    setPopupName(recommendation.firstName + ' ' + (recommendation.lastName || ''));
    setPopupAvatar(recommendation.avatar || '');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/v1/users/like', {
        recommendedUserId: recommendation._id,
        recommendationId: recommendation.recommendationId,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => {
        setShowPopup(false);
        // Redirect to chat page with userId and default message as query param
        const defaultMsg = encodeURIComponent('Hi, I just sent you an invitation!');
        navigate(`/chat?userId=${recommendation._id}&prefill=${defaultMsg}`);
      }, 1500);
    } catch (err) {
      setShowPopup(false);
      setError('Failed to connect.');
    }
  };

  // UI rendering
  return (
    <section className="bg-white rounded-2xl p-4 lg:p-8 shadow-lg w-full border border-gray-100">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6 flex items-center gap-3">
        <span className="text-xl lg:text-2xl">✨</span>
        Daily Recommendations
      </h2>
      <div className="relative min-h-[180px]">
        {/* Animated Popup */}
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-30 backdrop-blur-sm backdrop-saturate-150">
            <div className="bg-gradient-to-br from-blue-100 via-white to-indigo-100 rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center animate-pop-in">
              <div className="text-5xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-2xl font-bold text-blue-700 mb-2 animate-fade-in">Invitation Sent!</h3>
              <p className="text-gray-600 text-center mb-4 animate-fade-in">You've sent an invitation to <span className="font-semibold">{popupName}</span>.<br/>Redirecting to chat...</p>
              {popupAvatar && (
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-blue-200 mb-2 animate-fade-in">
                  <img src={popupAvatar} alt={popupName} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            {/* Animations */}
            <style>{`
              .animate-pop-in {
                animation: pop-in 0.5s cubic-bezier(.68,-0.55,.27,1.55);
              }
              @keyframes pop-in {
                0% { transform: scale(0.7); opacity: 0; }
                80% { transform: scale(1.05); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
              .animate-fade-in { animation: fade-in 0.7s; }
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-lg text-gray-500">Loading...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-red-500">
            <div className="text-2xl mb-2">😕</div>
            <div>{error}</div>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full" onClick={fetchRecommendation}>Try Again</button>
          </div>
        ) : recommendation ? (
          <div className="flex items-center gap-8 py-4 w-full transition-all duration-300">
            {/* Profile Info */}
            <div className="flex items-center gap-6 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-200 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg flex-shrink-0 flex items-center justify-center text-4xl font-bold text-blue-700">
                {recommendation.avatar ? (
                  <img src={recommendation.avatar} alt={recommendation.firstName} className="w-full h-full object-cover" />
                ) : (
                  <span>
                    {recommendation.firstName?.charAt(0)?.toUpperCase() || ''}
                    {recommendation.lastName?.charAt(0)?.toUpperCase() || ''}
                  </span>
                )}
              </div>
              {/* Profile Details */}
              <div className="flex flex-col gap-2 min-w-0">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-800 m-0 truncate">{recommendation.firstName} {recommendation.lastName}</h3>
                <p className="text-base lg:text-lg text-gray-600 m-0 font-medium">{recommendation.age} • {recommendation.profession}</p>
                <p className="text-sm lg:text-base text-gray-500 m-0 truncate">{recommendation.city}, {recommendation.country}</p>
                <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-full mt-2 lg:mt-4 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:from-blue-700 hover:to-indigo-700 text-sm lg:text-base w-fit"
                  onClick={handleConnect}
                >
                  Connect
                </button>
              </div>
            </div>
            {/* Match Info & Skip Button on right */}
            <div className="flex flex-col items-end justify-center min-w-[120px] lg:min-w-[140px] gap-3 lg:gap-4 ml-auto">
              <div className="text-right">
                <div className="text-3xl lg:text-4xl font-bold text-green-600 mb-1 lg:mb-2">{match}%</div>
                <span className="text-xs lg:text-sm font-semibold text-green-600 bg-green-50 px-3 lg:px-4 py-1 lg:py-2 rounded-full">Perfect Match</span>
              </div>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 lg:py-3 px-4 lg:px-6 rounded-full transition-all duration-300 hover:shadow-md hover:scale-105 text-sm lg:text-base"
                onClick={handleSkip}
              >
                ⏭️ Skip
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default DailyRecommendations;
