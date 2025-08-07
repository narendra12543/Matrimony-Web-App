import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../contexts/Chat/AuthContext";
import { useRequest } from "../../../hooks/useRequest";
import { getImageUrl } from "../../../utils/imageUtils";
import toast from "react-hot-toast";
function DailyRecommendations() {
  console.log("DailyRecommendations component rendering...");
  const [recommendation, setRecommendation] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupName, setPopupName] = useState("");
  const [popupAvatar, setPopupAvatar] = useState("");
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const canSendRequest =
    user &&
    (user.trial?.isActive ||
      (user.subscription?.isActive &&
        user.subscription?.planName === "Elite VIP") ||
      (user.subscription?.isActive &&
        user.subscription?.planName === "Premium" &&
        user.connectionRequestsThisWeek < 10) ||
      (!user.subscription?.isActive &&
        !user.trial?.isActive &&
        user.connectionRequestsThisWeek < 3));

  const getConnectionLimitMessage = () => {
    if (!user) return "";
    if (
      user.trial?.isActive ||
      (user.subscription?.isActive &&
        user.subscription?.planName === "Elite VIP")
    ) {
      return ""; // Unlimited for these users
    }
    if (
      user.subscription?.isActive &&
      user.subscription?.planName === "Premium"
    ) {
      return `Premium Plan users can send 10 requests per week. You have sent ${user.connectionRequestsThisWeek} this week.`;
    }
    // Basic user
    return `Basic Plan users can send 3 requests per week. You have sent ${user.connectionRequestsThisWeek} this week.`;
  };

  const connectionLimitMessage = getConnectionLimitMessage();

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch daily recommendation on mount
  useEffect(() => {
    console.log("DailyRecommendations useEffect triggered.");
    fetchRecommendation();
    // eslint-disable-next-line
  }, []);

  // Utility to check if a string is a valid JWT (very basic check)
  const isValidJWT = (token) => {
    if (!token) return false;
    const parts = token.split(".");
    return parts.length === 3 && parts.every(Boolean);
  };

  const fetchRecommendation = async () => {
    console.log("fetchRecommendation started.");
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!isValidJWT(token)) {
      setError("Session expired or invalid. Please log in again.");
      localStorage.removeItem("token");
      // Optionally, redirect to login:
      // navigate("/login");
      setLoading(false);
      return;
    }
    try {
      console.log("Fetching recommendation with token:", token);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/users/daily-recommendation`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Recommendation fetched successfully:", res.data);
      setRecommendation(res.data.recommendation);
      setMatch(res.data.matchPercentage);
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      setRecommendation(null);
      setMatch(null);
      if (err.response?.status === 401) {
        setError("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        // Optionally, redirect to login:
        // navigate("/login");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to fetch recommendation.");
      }
    } finally {
      setLoading(false);
      console.log("fetchRecommendation finished.");
    }
  };

  const handleSkip = async () => {
    if (!recommendation?.recommendedUserId?._id) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/users/skip`,
        {
          skippedUserId: recommendation.recommendedUserId._id,
          recommendationId: recommendation.recommendationId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchRecommendation();
    } catch (err) {
      setError("Failed to skip recommendation.");
    }
  };

  // ... (rest of the imports)

  // function DailyRecommendations() {
  // ... (state declarations)
  const { sendRequest: sendInvite, loading: requestLoading } = useRequest();

  // ... (useEffect)

  const handleConnect = async () => {
    if (!recommendation?.recommendedUserId?._id) return;
    const success = await sendInvite(recommendation.recommendedUserId._id);
    if (success) {
      setShowPopup(true);
      setPopupName(
        recommendation.recommendedUserId.firstName +
          " " +
          (recommendation.recommendedUserId.lastName || "")
      );
      setPopupAvatar(recommendation.recommendedUserId.photos?.[0] || "");
      setTimeout(() => {
        setShowPopup(false);
        // Redirect to chat page with userId and default message as query param
        const defaultMsg = encodeURIComponent(
          "Hi, I just sent you an invitation!"
        );
        navigate(
          `/chat?userId=${recommendation.recommendedUserId._id}&prefill=${defaultMsg}`
        );
      }, 1500);
    }
  };
  const handleViewProfile = () => {
    navigate(`/profile/${recommendation.recommendedUserId._id}`);
  };

  // ... (rest of the component)

  console.log("Daily Recommendation Data (from frontend):", recommendation);

  // UI rendering
  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg dark:shadow-xl w-full border border-gray-100 dark:border-gray-800">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-3">
        <span className="text-xl sm:text-2xl">✨</span>
        Daily Recommendations
      </h2>

      <div className="relative min-h-[180px]">
        {/* Animated Popup */}
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-30 backdrop-blur-sm backdrop-saturate-150">
            <div className="bg-gradient-to-br from-blue-100 via-white to-indigo-100 rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center animate-pop-in">
              <div className="text-5xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-2xl font-bold text-blue-700 mb-2 animate-fade-in">
                Invitation Sent!
              </h3>
              <p className="text-gray-600 text-center mb-4 animate-fade-in">
                You've sent an invitation to{" "}
                <span className="font-semibold">{popupName}</span>.<br />
                Redirecting to chat...
              </p>
              {popupAvatar && (
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-blue-200 mb-2 animate-fade-in">
                  <img
                    src={popupAvatar}
                    alt={popupName}
                    className="w-full h-full object-cover"
                  />
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
          <div className="flex items-center justify-center h-40 text-lg text-gray-500">
            Loading...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-red-500">
            <div className="text-2xl mb-2">😕</div>
            {error === "Partner gender not specified" ? (
              <div>
                Please specify your partner's gender in your profile settings to
                receive daily recommendations.
              </div>
            ) : (
              <div>{error}</div>
            )}
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full"
              onClick={fetchRecommendation}
            >
              Try Again
            </button>
          </div>
        ) : recommendation ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 py-4 w-full transition-all duration-300">
            {/* Profile Info */}
            <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-200 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg flex-shrink-0 flex items-center justify-center text-4xl font-bold text-blue-700">
                {(() => {
                  const photoUrl =
                    recommendation.recommendedUserId?.photos?.[0];
                  console.log("Photo URL:", photoUrl);
                  if (photoUrl) {
                    return (
                      <img
                        src={getImageUrl(photoUrl)}
                        alt={recommendation.recommendedUserId.firstName}
                        className="w-full h-full object-cover"
                      />
                    );
                  } else {
                    return (
                      <span>
                        {recommendation.recommendedUserId?.firstName
                          ?.charAt(0)
                          ?.toUpperCase() || ""}
                        {recommendation.recommendedUserId?.lastName
                          ?.charAt(0)
                          ?.toUpperCase() || ""}
                      </span>
                    );
                  }
                })()}
              </div>
              {/* Profile Details */}
              <div className="flex flex-col gap-2 min-w-0">
                <h3 className="text-lg sm:text-xl dark:text-white lg:text-2xl font-bold text-gray-800 m-0 truncate">
                  {recommendation.recommendedUserId?.firstName}{" "}
                  {recommendation.recommendedUserId?.lastName}
                </h3>
                <p className="text-sm sm:text-base dark:text-white lg:text-lg text-gray-600 m-0 font-medium">
                  {calculateAge(recommendation.recommendedUserId?.dateOfBirth)}{" "}
                  • {recommendation.recommendedUserId?.occupation}
                </p>
                <p className="text-xs sm:text-sm lg:text-base text-gray-500 m-0 truncate">
                  {recommendation.recommendedUserId?.city},{" "}
                  {recommendation.recommendedUserId?.country}
                </p>
                <button
                  className={`font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-full mt-2 sm:mt-4 transition-all duration-300 hover:shadow-xl text-xs sm:text-sm lg:text-base w-fit ${
                    canSendRequest
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:from-blue-700 hover:to-indigo-700"
                      : "bg-gray-400 text-gray-700 cursor-not-allowed"
                  }`}
                  onClick={handleConnect}
                  disabled={!canSendRequest}
                >
                  {canSendRequest ? "Connect" : "Limit Reached"}
                </button>
                {!canSendRequest && (
                  <p className="text-red-500 text-xs mt-1">
                    {connectionLimitMessage}
                  </p>
                )}
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-full mt-2 sm:mt-4 transition-all duration-300 hover:shadow-md hover:scale-105 text-xs sm:text-sm lg:text-base w-fit"
                  onClick={handleViewProfile}
                >
                  View Profile
                </button>
              </div>
            </div>
            {/* Match Info & Skip Button on right */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto min-w-[120px] lg:min-w-[140px] gap-3 lg:gap-4 mt-4 sm:mt-0 sm:ml-auto">
              <div className="text-right">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-1 lg:mb-2">
                  {match}%
                </div>
                <span className="text-xs lg:text-sm font-semibold text-green-600 bg-green-50 px-2 sm:px-3 lg:px-4 py-1 lg:py-2 rounded-full">
                  Perfect Match
                </span>
              </div>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-full transition-all duration-300 hover:shadow-md hover:scale-105 text-xs sm:text-sm lg:text-base"
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
