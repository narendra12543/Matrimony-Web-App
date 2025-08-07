import React, { useEffect, useState, useRef } from "react";
import { getVisitors } from "../../../services/visitorService";
import { useAuth } from "../../../contexts/Chat/AuthContext";
import { getImageUrl } from "../../../utils/imageUtils";
import { Star, Eye, Lock, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function RecentVisitors() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getVisitors(user._id)
      .then((data) => {
        console.log("Visitors data received by frontend:", data);
        setVisitors(data);
      })
      .catch(() => setVisitors([]))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      const handleScroll = () => {
        setShowLeftArrow(scrollElement.scrollLeft > 0);
        setShowRightArrow(
          scrollElement.scrollLeft + scrollElement.clientWidth <
            scrollElement.scrollWidth
        );
      };

      handleScroll(); // Initial check
      scrollElement.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll); // Re-check on resize

      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [visitors, loading]); // Re-run when visitors data or loading state changes

  const scroll = (direction) => {
    const scrollAmount = 200; // Adjust as needed
    if (scrollRef.current) {
      if (direction === "left") {
        scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  const isPremium =
    user && (user.subscription?.isActive || user.trial?.isActive);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl p-4  shadow-lg dark:shadow-xl hover:shadow-xl w-full transition-all duration-300 border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          Recent Visitors
          {!isPremium && (
            <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              PRO
            </span>
          )}
        </h2>
        {visitors.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {visitors.length} {visitors.length === 1 ? "visit" : "visits"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
            No visitors yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Your profile hasn't been viewed by anyone recently.
          </p>
        </div>
      ) : isPremium ? (
        <div className="relative">
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          )}
          <div className="relative">
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide"
            >
              {visitors.map((v) => (
                <div
                  key={v._id}
                  onClick={() => navigate(`/profile/${v.visitorUserId?._id}`)}
                  className="flex-shrink-0 w-36 group relative bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-600"
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
                    {v.visitorUserId?.photos?.[0] ? (
                      <img
                        src={getImageUrl(v.visitorUserId.photos[0])}
                        alt={v.visitorUserId.firstName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-600 dark:text-purple-300">
                        <span className="text-3xl font-bold">
                          {v.visitorUserId?.firstName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate">
                      {v.visitorUserId?.firstName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {v.visitorUserId?.age || "--"} •{" "}
                      {v.visitorUserId?.city || "--"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {showRightArrow && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            >
              <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="relative">
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide opacity-60"
            >
              {visitors.map((v) => (
                <div key={v._id} className="flex-shrink-0 w-36 relative">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
                      {v.visitorUserId?.photos?.[0] ? (
                        <img
                          src={getImageUrl(v.visitorUserId.photos[0])}
                          alt={v.visitorUserId.firstName}
                          className="w-full h-full object-cover blur-md"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-purple-600 dark:text-purple-300 blur-md">
                          <span className="text-3xl font-bold">
                            {v.visitorUserId?.firstName?.[0]}
                            {v.visitorUserId?.lastName?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate blur-sm">
                        {v.visitorUserId?.firstName}{" "}
                        {v.visitorUserId?.lastName?.[0]}.
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate blur-sm">
                        {v.visitorUserId?.age || "--"} •{" "}
                        {v.visitorUserId?.city || "--"}
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
            {showRightArrow && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-white/70 dark:via-gray-900/70 to-transparent pointer-events-none h-full"></div>
          </div>

          <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 text-center">
            <div className="mx-auto w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-md">
              <Star className="w-8 h-8 text-yellow-500 fill-current" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Unlock Your Profile Visitors
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
              Upgrade to Premium to see who's interested in you and view
              detailed profiles.
            </p>
            <button
              onClick={() => navigate("/plans")}
              className="px-4 py-2 rounded-full font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all hover:scale-105"
            >
              Upgrade Now
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default RecentVisitors;
