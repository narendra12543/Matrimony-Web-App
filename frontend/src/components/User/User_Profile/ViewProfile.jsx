import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Briefcase,
  Home,
  Heart,
  Camera,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Users,
  GraduationCap,
  Building,
  DollarSign,
  Edit,
} from "lucide-react";
import BackButton from "../../BackButton";
import { useAuth } from "../../../contexts/Chat/AuthContext";
import axios from "axios";
import { addVisitor } from "../../../services/visitorService";
import LoadingSpinner from "../../LoadingSpinner";
import { getImageUrl } from "../../../utils/imageUtils";

const ViewProfile = ({ onEdit, isDarkMode }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        if (user && profileData && user._id === profileData._id) {
          setProfileData(user); // Use merged user from AuthContext for self
          setLoading(false);
          return;
        }
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/users/${user._id}`
        );
        setProfileData(response.data);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    if (user && user._id) {
      fetchProfile();
    }
  }, [user]);

  // Refresh profile data periodically to get latest images
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (user && user._id && !loading) {
        const fetchLatestProfile = async () => {
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/v1/users/${user._id}`
            );
            setProfileData(response.data);
          } catch (err) {
            console.error("Failed to refresh profile:", err);
          }
        };
        fetchLatestProfile();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, loading]);

  React.useEffect(() => {
    if (user && profileData && user._id !== profileData._id) {
      addVisitor({ visitedUserId: profileData._id, visitorUserId: user._id })
        .then(() => console.log("Visitor added successfully"))
        .catch((err) => console.error("Error adding visitor:", err));
    }
  }, [user, profileData]);

  // Force refresh images when profile data changes (e.g., after upload)
  React.useEffect(() => {
    if (profileData && profileData.photos) {
      // Force a re-render of images by adding a timestamp
      const event = new CustomEvent("profileImagesUpdated", {
        detail: { timestamp: Date.now() },
      });
      window.dispatchEvent(event);
    }
  }, [profileData?.photos]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const InfoCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-6 border border-gray-300 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-6 h-6 text-black dark:text-white" />
        <h3 className="text-xl font-bold text-black dark:text-white">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          {label}:
        </span>
        <span className="text-black dark:text-white">{value}</span>
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner
          size="lg"
          color="blue"
          text="Loading profile..."
          fullScreen={true}
        />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-600">
        {error}
      </div>
    );
  if (!profileData) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-black dark:text-white mb-2">
              {profileData.firstName} {profileData.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {calculateAge(profileData.dateOfBirth) &&
                `${calculateAge(profileData.dateOfBirth)} years old`}
              {profileData.city &&
                profileData.state &&
                ` • ${profileData.city}, ${profileData.state}`}
            </p>
          </div>

          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <button
              onClick={onEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
            >
              <Edit className="w-5 h-5" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => {
                setLoading(true);
                const fetchLatestProfile = async () => {
                  try {
                    const response = await axios.get(
                      `${import.meta.env.VITE_API_URL}/api/v1/users/${user._id}`
                    );
                    setProfileData(response.data);
                  } catch (err) {
                    setError("Failed to refresh profile");
                  } finally {
                    setLoading(false);
                  }
                };
                fetchLatestProfile();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Photos */}
          <div className="lg:col-span-1">
            <InfoCard title="Photos" icon={Camera}>
              {profileData.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-4">
                  {profileData.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={getImageUrl(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      onError={(e) => {
                        console.log("Image failed to load:", photo);
                        // Retry loading the image after a short delay
                        setTimeout(() => {
                          if (e.target) {
                            e.target.src = getImageUrl(photo, true);
                          }
                        }, 1000);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No photos uploaded
                  </p>
                </div>
              )}
            </InfoCard>
          </div>

          {/* Right Column - Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <InfoCard title="Personal Information" icon={User}>
              <div className="space-y-2">
                <InfoRow
                  label="Full Name"
                  value={`${profileData.firstName} ${profileData.lastName}`}
                />
                <InfoRow
                  label="Date of Birth"
                  value={profileData.dateOfBirth}
                />
                <InfoRow
                  label="Age"
                  value={calculateAge(profileData.dateOfBirth).toString()}
                />
                <InfoRow label="Gender" value={profileData.gender} />
                <InfoRow label="Height" value={profileData.height} />
                <InfoRow
                  label="Marital Status"
                  value={profileData.maritalStatus}
                />
                <InfoRow label="Religion" value={profileData.religion} />
                <InfoRow
                  label="Mother Tongue"
                  value={profileData.motherTongue}
                />
              </div>
            </InfoCard>

            {/* Contact Information */}
            <InfoCard title="Contact & Location" icon={MapPin}>
              <div className="space-y-2">
                <InfoRow label="Email" value={profileData.email} />
                <InfoRow label="Phone" value={profileData.phone} />
                <InfoRow label="Country" value={profileData.country} />
                <InfoRow label="State" value={profileData.state} />
                <InfoRow label="City" value={profileData.city} />
                <InfoRow
                  label="Residential Status"
                  value={profileData.residentialStatus}
                />
              </div>
            </InfoCard>

            {/* Professional Information */}
            <InfoCard title="Professional Information" icon={Briefcase}>
              <div className="space-y-2">
                <InfoRow label="Education" value={profileData.education} />
                <InfoRow
                  label="Education Details"
                  value={profileData.educationDetails}
                />
                <InfoRow label="Occupation" value={profileData.occupation} />
                <InfoRow
                  label="Occupation Details"
                  value={profileData.occupationDetails}
                />
                <InfoRow
                  label="Annual Income"
                  value={profileData.annualIncome}
                />
                <InfoRow
                  label="Work Location"
                  value={profileData.workLocation}
                />
              </div>
            </InfoCard>

            {/* Family Information */}
            <InfoCard title="Family Information" icon={Home}>
              <div className="space-y-2">
                <InfoRow label="Family Type" value={profileData.familyType} />
                <InfoRow
                  label="Family Status"
                  value={profileData.familyStatus}
                />
                <InfoRow
                  label="Father's Occupation"
                  value={profileData.fatherOccupation}
                />
                <InfoRow
                  label="Mother's Occupation"
                  value={profileData.motherOccupation}
                />
                <InfoRow label="Siblings" value={profileData.siblings} />
                <InfoRow
                  label="Family Location"
                  value={profileData.familyLocation}
                />
              </div>
            </InfoCard>

            {/* Lifestyle Information */}
            <InfoCard title="Lifestyle " icon={Heart}>
              <div className="space-y-2">
                <InfoRow label="Diet" value={profileData.diet} />
                <InfoRow label="Smoking" value={profileData.smoking} />
                <InfoRow label="Drinking" value={profileData.drinking} />
                <InfoRow label="Hobbies" value={profileData.hobbies} />
                {profileData.aboutMe && (
                  <div className="pt-4">
                    <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                      About Me
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {profileData.aboutMe}
                    </p>
                  </div>
                )}
              </div>
            </InfoCard>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center mt-8 space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onEdit}
            className="px-8 py-3 bg-gray-600 dark:bg-gray-400 text-white dark:text-black rounded-full font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-all shadow-lg hover:shadow-xl"
          >
            Edit Profile
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
          >
            Print Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
