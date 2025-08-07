import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserById } from "../services/userService";
import { sendRequest, getUserRequests } from "../services/requestService";
import { addVisitor } from "../services/visitorService";
import { useRequest } from "../hooks/useRequest";
import { getImageUrl, getImageUrls } from "../utils/imageUtils";

import { useAuth } from "../contexts/Chat/AuthContext";
import {
  MessageCircle,
  Heart,
  Star,
  Globe,
  Briefcase,
  GraduationCap,
  MapPin,
  Cake,
  Smartphone,
  User,
  Camera,
  Smile,
  Globe2,
  Coffee,
  Music,
  BookOpen,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function UserProfilePage({ isDarkMode }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteStatus, setInviteStatus] = useState("idle");
  const [activeTab, setActiveTab] = useState("about");
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  console.log(userId);

  useEffect(() => {
    const fetchProfileAndRequests = async () => {
      setLoading(true);
      try {
        if (user && userId === user._id) {
          setProfile(user); // Use merged user from AuthContext for self
          setLoading(false);
          return;
        }
        const currentProfile = await getUserById(userId);
        console.log("Fetched profile:", currentProfile); // Debug log
        if (!currentProfile || currentProfile.error) {
          setProfile(null);
        } else {
          setProfile(currentProfile);
        }

        if (user && user._id && currentProfile) {
          // Add visitor entry
          if (user._id !== currentProfile._id) {
            try {
              await addVisitor({
                visitedUserId: currentProfile._id,
                visitorUserId: user._id,
              });
            } catch (visitorError) {
              // ignore
            }
          }

          const userRequests = await getUserRequests();

          // Check if a request has been sent by the current user to this profile
          const sentRequest = userRequests.sent.find(
            (req) => req.receiver._id === currentProfile._id
          );
          if (sentRequest) {
            setInviteStatus(sentRequest.status); // 'pending', 'accepted', 'rejected'
          } else {
            // Check if a request has been received by the current user from this profile
            const receivedRequest = userRequests.received.find(
              (req) => req.sender._id === currentProfile._id
            );
            if (receivedRequest) {
              setInviteStatus(
                receivedRequest.status === "pending"
                  ? "received"
                  : receivedRequest.status
              ); // 'pending', 'accepted', 'rejected'
            } else {
              setInviteStatus("idle"); // No request exists
            }
          }
        }
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndRequests();
  }, [userId, user]);

  // ... (rest of the imports)

  // export default function UserProfilePage({ isDarkMode }) {
  // ... (state declarations)
  const { sendRequest: sendInvite, loading: requestLoading } = useRequest();

  // ... (useEffect)

  const handleSendInvite = async () => {
    if (!user || !profile?._id || user._id === profile._id) return;
    const success = await sendInvite(profile._id);
    if (success) {
      setInviteStatus("sent");
    }
  };

  // ... (rest of the component)

  const handleMessage = () => {
    navigate(`/chat/${profile._id}`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-purple-200 dark:bg-purple-700 h-24 w-24 mb-4"></div>
          <div className="h-6 bg-purple-200 dark:bg-purple-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-purple-200 dark:bg-purple-700 rounded w-32"></div>
        </div>
      </div>
    );

  if (!profile)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <div className="text-6xl mb-4">👻</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Profile Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6">
          The profile you're looking for doesn't exist or may have been removed
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 rounded-full font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all"
        >
          Discover Other Profiles
        </button>
      </div>
    );

  // Calculate age from date of birth
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
    ) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile.dateOfBirth);

  // Process interests and hobbies
  const interestsArray = Array.isArray(profile.interests)
    ? profile.interests
    : typeof profile.interests === "string"
    ? profile.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const hobbiesArray = Array.isArray(profile.hobbies)
    ? profile.hobbies
    : typeof profile.hobbies === "string"
    ? profile.hobbies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Icon mapping for interests
  const interestIcons = {
    travel: <Globe2 className="w-5 h-5 mr-2 text-blue-500" />,
    music: <Music className="w-5 h-5 mr-2 text-purple-500" />,
    reading: <BookOpen className="w-5 h-5 mr-2 text-green-500" />,
    coffee: <Coffee className="w-5 h-5 mr-2 text-amber-600" />,
    default: <Smile className="w-5 h-5 mr-2 text-pink-500" />,
  };

  const getInterestIcon = (interest) => {
    const lowerInterest = interest.toLowerCase();
    for (const [key, icon] of Object.entries(interestIcons)) {
      if (lowerInterest.includes(key)) return icon;
    }
    return interestIcons.default;
  };

  const openModal = (index) => {
    setCurrentImageIndex(index);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === profile.photos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? profile.photos.length - 1 : prevIndex - 1
    );
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-br from-gray-400 to-gray-900"
      } py-8 px-4 sm:px-6 lg:px-8 dark:bg-gray-900`}
    >
      <Toaster position="top-center" reverseOrder={false} />
      {/* Floating decorative elements */}
      <div className="fixed top-20 left-10 w-32 h-32 rounded-full bg-purple-100 dark:bg-purple-900 opacity-20 blur-xl -z-10"></div>
      <div className="fixed bottom-40 right-20 w-48 h-48 rounded-full bg-pink-100 dark:bg-pink-900 opacity-20 blur-xl -z-10"></div>

      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="relative  rounded-2xl overflow-hidden mb-6 shadow-lg">
          <div
            className="h-48 md:h-64 w-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{
              backgroundImage:
                profile.photos && profile.photos.length > 1
                  ? `url(${profile.photos[1]})`
                  : profile.photos && profile.photos.length > 0
                  ? `url(${profile.photos[0]})`
                  : `linear-gradient(to right, var(--tw-gradient-stops))`, // Fallback to gradient
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>

          {/* Profile picture */}
          <div className="absolute -bottom-20 mb-[150px] ml-[-100px] left-1/2 transform -translate-x-1/2 z-10">
            <div className="relative group">
              {profile.photos && profile.photos.length > 0 ? (
                <img
                  src={getImageUrl(profile.photos[0])}
                  alt={profile.firstName}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-xl transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-5xl font-bold text-purple-700 border-4 border-white shadow-xl">
                  {profile.firstName?.[0]}
                  {profile.lastName?.[0]}
                </div>
              )}
              {profile.isVerified && (
                <div className="absolute -top-2 -right-2 bg-white p-1 rounded-full shadow-md">
                  <Star className="w-5 h-5 text-blue-500 fill-current" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main profile content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mt-20 md:mt-12 mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
              {profile.firstName} {profile.lastName}
              {age && (
                <span className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 ml-2">
                  , {age}
                </span>
              )}
            </h1>
            <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-6">
              <MapPin className="w-4 h-4 mr-1" />
              <span>
                {[profile.city, profile.country].filter(Boolean).join(", ") ||
                  "Unknown location"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <button
                onClick={handleSendInvite}
                disabled={inviteStatus !== "idle" || inviteStatus === "loading"}
                className={`px-6 py-2 rounded-full font-medium flex items-center justify-center gap-2 transition-all w-full sm:w-auto ${
                  inviteStatus === "accepted"
                    ? "bg-green-500 text-white cursor-not-allowed"
                    : inviteStatus === "rejected"
                    ? "bg-red-500 text-white cursor-not-allowed"
                    : inviteStatus === "pending" || inviteStatus === "received"
                    ? "bg-yellow-500 text-white cursor-not-allowed"
                    : inviteStatus === "loading"
                    ? "bg-gray-500 text-white opacity-80 cursor-wait"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                <Heart className="w-5 h-5" />
                {inviteStatus === "pending"
                  ? "Request Pending"
                  : inviteStatus === "accepted"
                  ? "Request Accepted"
                  : inviteStatus === "rejected"
                  ? "Request Rejected"
                  : inviteStatus === "loading"
                  ? "Sending..."
                  : "Connect"}
              </button>
              <button
                onClick={handleMessage}
                className="px-6 py-2 rounded-full font-medium flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <MessageCircle className="w-5 h-5" />
                Message
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex justify-center border-b border-gray-200 dark:border-gray-600 mb-8">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
              {["about", "interests", "photos"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                    activeTab === tab
                      ? "bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="space-y-8">
            {activeTab === "about" && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* About section */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-purple-500" />
                      About Me
                    </h2>
                    {profile.aboutMe ? (
                      <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                        {profile.aboutMe}
                      </p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">
                        No bio yet
                      </p>
                    )}
                  </div>

                  {/* Personal details */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-purple-500" />
                      Personal Details
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Cake className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Birthday
                          </div>
                          <div className="dark:text-white">
                            {profile.dateOfBirth
                              ? new Date(
                                  profile.dateOfBirth
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "Not specified"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <User className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Gender
                          </div>
                          <div className="dark:text-white">
                            {profile.gender || "Not specified"}
                          </div>
                        </div>
                      </div>
                      {/* <div className="flex items-start">
                        <Smartphone className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Phone
                          </div>
                          <div className="dark:text-white">
                            {profile.phone || "Not specified"}
                          </div>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>

                {/* Professional details */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-purple-500" />
                      Professional Life
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <GraduationCap className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Education
                          </div>
                          <div className="dark:text-white">
                            {profile.education || "Not specified"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Briefcase className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Occupation
                          </div>
                          <div className="dark:text-white">
                            {profile.occupation || "Not specified"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Work Location
                          </div>
                          <div className="dark:text-white">
                            {profile.workLocation || "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility meter */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-pink-500" />
                      Compatibility
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            Personality Match
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {Math.floor(Math.random() * 30) + 70}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full"
                            style={{
                              width: `${Math.floor(Math.random() * 30) + 70}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            Interest Similarity
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {Math.floor(Math.random() * 40) + 60}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full"
                            style={{
                              width: `${Math.floor(Math.random() * 40) + 60}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "interests" && (
              <div className="space-y-8">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-pink-500" />
                    Interests & Hobbies
                  </h2>

                  {interestsArray.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {interestsArray.map((interest, idx) => (
                          <div
                            key={interest}
                            className="flex items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all"
                          >
                            {getInterestIcon(interest)}
                            <span className="text-gray-800 dark:text-gray-200">
                              {interest}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hobbiesArray.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">
                        Hobbies
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {hobbiesArray.map((hobby, idx) => (
                          <div
                            key={hobby}
                            className="flex items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all"
                          >
                            {getInterestIcon(hobby)}
                            <span className="text-gray-800 dark:text-gray-200">
                              {hobby}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {interestsArray.length === 0 && hobbiesArray.length === 0 && (
                    <div className="text-center py-8">
                      <Smile className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No interests or hobbies specified yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "photos" && (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-purple-500" />
                  Photo Gallery
                </h2>
                {profile.photos && profile.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="aspect-square bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
                        onClick={() => openModal(idx)}
                      >
                        <img
                          src={getImageUrl(photo)}
                          alt={`${profile.firstName}'s photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                      No photos yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      When {profile.firstName} shares photos, they'll appear
                      here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Image Modal */}
      {showModal && profile.photos && profile.photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={closeModal}
        >
          <div
            className="relative max-w-3xl max-h-full mx-auto p-4"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
          >
            <button
              className="absolute top-2 right-2 text-white text-3xl font-bold p-2"
              onClick={closeModal}
            >
              &times;
            </button>
            <img
              src={getImageUrl(profile.photos[currentImageIndex])}
              alt={`Enlarged photo ${currentImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            {profile.photos.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                  onClick={goToPrevious}
                >
                  &#10094;
                </button>
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                  onClick={goToNext}
                >
                  &#10095;
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
