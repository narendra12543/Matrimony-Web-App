import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/Chat/AuthContext";
import { getMatchedUsers } from "../../../services/feedService";
import { getUserRequests } from "../../../services/requestService";
import {
  MessageCircle,
  Briefcase,
  GraduationCap,
  MapPin,
  Star,
  User,
  Heart,
} from "lucide-react";
import BackButton from "../../BackButton";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { useRequest } from "../../../hooks/useRequest";
import toast from "react-hot-toast";
import { useTheme } from "../../../contexts/ThemeContext";
import { getImageUrl } from "../../../utils/imageUtils";

function ProfileCard({
  profile,
  onViewProfile,
  onSendInvite,
  inviteStatus,
  onMessage,
  matchPercentage,
}) {
  const handleMessage = (e) => {
    e.stopPropagation();
    if (onMessage) onMessage(profile);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      scale: 0.98,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      className="bg-white rounded-3xl overflow-hidden shadow-xl cursor-pointer border border-gray-100"
      onClick={() => onViewProfile(profile)}
      whileHover={{
        y: -8,
        scale: 1.03,
        boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {/* Profile Image */}
      <div className="relative h-80 overflow-hidden flex items-center justify-center bg-gray-100">
        <motion.img
          src={
            getImageUrl(profile.photos && profile.photos[0]) ||
            getImageUrl(profile.avatar) ||
            "placeholder.jpg"
          }
          alt={`${profile.firstName} ${profile.lastName}`}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        {profile.verified && (
          <motion.div
            className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <Star className="w-3 h-3 fill-current" />
            Verified
          </motion.div>
        )}
        {matchPercentage !== undefined && matchPercentage !== null && (
          <motion.div
            className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            {matchPercentage}% Match
          </motion.div>
        )}
      </div>

      {/* Profile Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {profile.firstName} {profile.lastName}
          </h3>
          <div className="flex items-center text-gray-600 mb-3">
            <span className="font-medium">
              {profile.age ? `${profile.age} years` : ""}
            </span>
            {profile.age && <span className="mx-2"> • </span>}
            <MapPin className="w-4 h-4 mr-1" />
            <span>
              {profile.city}
              {profile.state ? `, ${profile.state}` : ""}
            </span>
            {profile.uniqueId && (
              <>
                <span className="mx-2"> • </span>
                <span className="text-blue-600 font-semibold">
                  {profile.uniqueId}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center p-3 bg-blue-50 rounded-xl">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-700 font-medium">
              {profile.occupation || profile.job}
            </span>
          </div>
          <div className="flex items-center p-3 bg-blue-50 rounded-xl">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-700 font-medium">
              {profile.education}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <motion.button
            onClick={handleMessage}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            whileHover={{
              scale: 1.05,
              y: -2,
              boxShadow: "0px 10px 20px rgba(37, 99, 235, 0.2)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSendInvite(profile);
            }}
            disabled={inviteStatus !== "idle" && inviteStatus !== "received"}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors duration-300 ${
              inviteStatus === "sent"
                ? "bg-blue-600 text-white cursor-not-allowed"
                : inviteStatus === "pending"
                ? "bg-blue-400 text-white cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            whileHover={{
              scale: 1.05,
              y: -2,
              boxShadow: "0px 10px 20px rgba(37, 99, 235, 0.2)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {inviteStatus === "sent"
              ? "Invitation Sent"
              : inviteStatus === "pending"
              ? "Request Pending"
              : inviteStatus === "accepted"
              ? "Request Accepted"
              : inviteStatus === "rejected"
              ? "Request Rejected"
              : inviteStatus === "received"
              ? "Respond to Request"
              : inviteStatus === "loading"
              ? "Sending..."
              : "Send Invitation"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MatrimonyFeed() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("any");
  const [hobbiesFilter, setHobbiesFilter] = useState("");
  const [interestsFilter, setInterestsFilter] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inviteMap, setInviteMap] = useState({});
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { sendRequest: sendInvite, loading: requestLoading } = useRequest();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchProfilesAndRequests = async () => {
      setLoading(true);
      try {
        const { profiles: fetchedProfiles } = await getMatchedUsers();
        console.log("Fetched profiles:", fetchedProfiles); // Debug line
        setProfiles(fetchedProfiles);

        if (user && user._id) {
          const userRequests = await getUserRequests();
          const newInviteMap = {};
          fetchedProfiles.forEach((profile) => {
            if (!profile) return;
            if (profile._id === user._id) return;
            const sentRequest = userRequests.sent.find(
              (req) => req.receiver && req.receiver._id === profile._id
            );
            if (sentRequest) {
              newInviteMap[profile._id] = sentRequest.status;
              return;
            }
            const receivedRequest = userRequests.received.find(
              (req) => req.sender && req.sender._id === profile._id
            );
            if (receivedRequest) {
              newInviteMap[profile._id] =
                receivedRequest.status === "pending"
                  ? "received"
                  : receivedRequest.status;
              return;
            }
            newInviteMap[profile._id] = "idle";
          });
          setInviteMap(newInviteMap);
        }
      } catch (error) {
        console.error("Error fetching profiles or requests:", error);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilesAndRequests();
  }, [user]);

  const filteredProfiles = (profiles || [])
    .filter((profile) => {
      if (!user) return true;

      const matchesHobbies =
        hobbiesFilter === "" ||
        (profile.hobbies &&
          profile.hobbies.toLowerCase().includes(hobbiesFilter.toLowerCase()));
      const matchesInterests =
        interestsFilter === "" ||
        (profile.interests &&
          profile.interests
            .toLowerCase()
            .includes(interestsFilter.toLowerCase()));

      return (
        profile._id &&
        profile._id !== user._id &&
        matchesHobbies &&
        matchesInterests &&
        (activeFilter === "all" ||
          (activeFilter === "verified" && profile.isVerified))
      );
    })
    .sort((a, b) => {
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const filters = [
    { key: "all", label: "All Profiles" },
    { key: "verified", label: "Verified" },
  ];

  const handleViewProfile = (profile) => {
    navigate(`/profile/${profile._id}`);
  };

  const handleSendInvite = async (profile) => {
    if (!user || !profile._id || user._id === profile._id) return;
    const success = await sendInvite(profile._id);
    if (success) {
      setInviteMap((prev) => ({ ...prev, [profile._id]: "sent" }));
    }
  };

  const handleMessage = (profile) => {
    navigate(`/chat/${profile._id}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 md:mb-6">
          <BackButton />
        </div>
      </div>
      <main className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent dark:from-blue-300 dark:to-blue-500 mb-2 md:mb-4">
            Find Your Perfect Match
          </h1>
          <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4 md:mb-8">
            Discover meaningful connections with people who share your values,
            interests, and life goals.
          </p>
          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6 md:mb-12">
            {filters.map((filter) => (
              <motion.button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeFilter === filter.key
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
                }`}
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {filter.label}
              </motion.button>
            ))}
          </div>

          {/* Filter Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 md:mb-12 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Filter Profiles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Hobbies Filter */}
              <div className="flex flex-col">
                <label
                  htmlFor="hobbiesFilter"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"
                >
                  <Heart className="w-4 h-4" /> Hobbies
                </label>
                <input
                  id="hobbiesFilter"
                  type="text"
                  placeholder="e.g., reading, sports"
                  value={hobbiesFilter}
                  onChange={(e) => setHobbiesFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600"
                />
              </div>

              {/* Interests Filter */}
              <div className="flex flex-col">
                <label
                  htmlFor="interestsFilter"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"
                >
                  <Star className="w-4 h-4" /> Interests
                </label>
                <input
                  id="interestsFilter"
                  type="text"
                  placeholder="e.g., technology, art"
                  value={interestsFilter}
                  onChange={(e) => setInterestsFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <motion.button
                onClick={() => {
                  setGenderFilter("any");
                  setHobbiesFilter("");
                  setInterestsFilter("");
                  setActiveFilter("all");
                }}
                className="px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear Filters
              </motion.button>
              <motion.button
                className="px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Apply Filters
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Profiles Grid */}
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-300 text-lg">
            Loading profiles...
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredProfiles.map((profile) => (
                <ProfileCard
                  key={
                    profile._id
                      ? String(profile._id)
                      : `fallback-${Math.random()}`
                  }
                  profile={profile}
                  onViewProfile={handleViewProfile}
                  onSendInvite={handleSendInvite}
                  inviteStatus={inviteMap[profile._id] || "idle"}
                  onMessage={handleMessage}
                  matchPercentage={profile.matchPercentage}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
