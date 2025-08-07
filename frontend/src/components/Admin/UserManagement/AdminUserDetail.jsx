import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserById } from "../../../services/adminService";
import { useTheme } from "../../../contexts/ThemeContext";
import BackButton from "../../BackButton";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Heart,
  BookOpen,
  Coffee,
  Utensils,
  Droplet,
  Shield,
  Crown,
  UserCheck,
  UserX,
  AlertTriangle,
  User,
  Users,
  Star,
} from "lucide-react";
import { getImageUrl } from "../../../utils/imageUtils";

const AdminUserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserById(id);
        setUser(userData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  // Refresh user data periodically to get latest images
  useEffect(() => {
    const interval = setInterval(() => {
      if (id && !loading) {
        const fetchLatestUser = async () => {
          try {
            const userData = await getUserById(id);
            setUser(userData);
          } catch (err) {
            console.error("Failed to refresh user data:", err);
          }
        };
        fetchLatestUser();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [id, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Loading user details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          User not found.
        </p>
      </div>
    );
  }

  const renderDetailItem = (icon, label, value) => {
    if (!value) return null;
    return (
      <div className="flex items-center space-x-3">
        {React.createElement(icon, {
          className: `w-5 h-5 ${
            isDarkMode ? "text-indigo-400" : "text-indigo-600"
          }`,
        })}
        <div>
          <p
            className={`text-sm font-medium ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {label}
          </p>
          <p
            className={`text-base ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    );
  };

  const renderSection = (title, children) => {
    const hasContent = React.Children.toArray(children).some(
      (child) => child !== null
    );
    if (!hasContent) return null;
    return (
      <div
        className={`${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } rounded-xl p-6 border shadow-sm`}
      >
        <h2
          className={`text-xl font-bold mb-4 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <BackButton />
        {/* Profile Image on Top */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={
              user.photos && user.photos.length > 0
                ? getImageUrl(user.photos[0])
                : "/default-avatar.svg"
            }
            alt="Profile"
            className="w-40 h-40 object-cover rounded-full shadow-lg border-4 border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800"
            onError={(e) => {
              console.log("Profile image failed to load");
              e.target.src = "/default-avatar.svg";
            }}
          />
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1
            className={`text-3xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            User Details: {user.firstName} {user.lastName}
          </h1>
          <button
            onClick={() => {
              setLoading(true);
              const fetchLatestUser = async () => {
                try {
                  const userData = await getUserById(id);
                  setUser(userData);
                } catch (err) {
                  setError(err);
                } finally {
                  setLoading(false);
                }
              };
              fetchLatestUser();
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

        {/* Basic Info */}
        {renderSection(
          "Basic Information",
          <>
            {renderDetailItem(UserCheck, "Gender", user.gender)}
            {renderDetailItem(
              Calendar,
              "Date of Birth",
              user.dateOfBirth
                ? new Date(user.dateOfBirth).toLocaleDateString()
                : "N/A"
            )}
            {renderDetailItem(User, "Height", user.height)}
            {renderDetailItem(User, "Weight", user.weight)}
            {renderDetailItem(Heart, "Marital Status", user.maritalStatus)}
            {renderDetailItem(BookOpen, "Religion", user.religion)}
            {renderDetailItem(BookOpen, "Caste", user.caste)}
            {renderDetailItem(BookOpen, "Mother Tongue", user.motherTongue)}
            {renderDetailItem(BookOpen, "Manglik", user.manglik)}
            {renderDetailItem(User, "Body Type", user.bodyType)}
            {renderDetailItem(User, "Complexion", user.complexion)}
            {renderDetailItem(User, "Physical Status", user.physicalStatus)}
          </>
        )}

        {/* Contact & Location */}
        {renderSection(
          "Contact & Location",
          <>
            {renderDetailItem(Mail, "Email", user.email)}
            {renderDetailItem(Phone, "Phone", user.phone)}
            {renderDetailItem(MapPin, "Country", user.country)}
            {renderDetailItem(MapPin, "State", user.state)}
            {renderDetailItem(MapPin, "City", user.city)}
            {renderDetailItem(
              MapPin,
              "Residential Status",
              user.residentialStatus
            )}
          </>
        )}

        {/* Professional */}
        {renderSection(
          "Professional Information",
          <>
            {renderDetailItem(GraduationCap, "Education", user.education)}
            {renderDetailItem(
              GraduationCap,
              "Education Details",
              user.educationDetails
            )}
            {renderDetailItem(Briefcase, "Occupation", user.occupation)}
            {renderDetailItem(
              Briefcase,
              "Occupation Details",
              user.occupationDetails
            )}
            {renderDetailItem(Briefcase, "Annual Income", user.annualIncome)}
            {renderDetailItem(MapPin, "Work Location", user.workLocation)}
          </>
        )}

        {/* Family */}
        {renderSection(
          "Family Information",
          <>
            {renderDetailItem(Users, "Family Type", user.familyType)}
            {renderDetailItem(Users, "Family Status", user.familyStatus)}
            {renderDetailItem(Users, "Family Values", user.familyValues)}
            {renderDetailItem(
              Briefcase,
              "Father's Occupation",
              user.fatherOccupation
            )}
            {renderDetailItem(
              Briefcase,
              "Mother's Occupation",
              user.motherOccupation
            )}
            {renderDetailItem(Users, "Siblings", user.siblings)}
            {renderDetailItem(MapPin, "Family Location", user.familyLocation)}
          </>
        )}

        {/* Lifestyle */}
        {renderSection(
          "Lifestyle",
          <>
            {renderDetailItem(Utensils, "Diet", user.diet)}
            {renderDetailItem(Coffee, "Smoking", user.smoking)}
            {renderDetailItem(Droplet, "Drinking", user.drinking)}
            {renderDetailItem(Heart, "Hobbies", user.hobbies)}
            {renderDetailItem(Star, "Interests", user.interests)}
          </>
        )}

        {/* Partner Preferences */}
        {renderSection(
          "Partner Preferences",
          <>
            {renderDetailItem(UserCheck, "Gender", user.partnerGender)}
            {renderDetailItem(
              Calendar,
              "Age Range",
              `${user.partnerAgeMin || "N/A"} - ${user.partnerAgeMax || "N/A"}`
            )}
            {renderDetailItem(
              User,
              "Height Range",
              `${user.partnerHeightMin || "N/A"} - ${
                user.partnerHeightMax || "N/A"
              }`
            )}
            {renderDetailItem(
              GraduationCap,
              "Education",
              user.partnerEducation
            )}
            {renderDetailItem(Briefcase, "Occupation", user.partnerOccupation)}
            {renderDetailItem(Briefcase, "Income", user.partnerIncome)}
            {renderDetailItem(MapPin, "Location", user.partnerLocation)}
            {renderDetailItem(BookOpen, "Religion", user.partnerReligion)}
            {renderDetailItem(BookOpen, "Caste", user.partnerCaste)}
            {renderDetailItem(
              Heart,
              "Marital Status",
              user.partnerMaritalStatus
            )}
            {renderDetailItem(BookOpen, "About Partner", user.partnerAbout)}
          </>
        )}

        {/* Account Status & Verification */}
        {renderSection(
          "Account Status & Verification",
          <>
            {renderDetailItem(Shield, "Account Status", user.accountStatus)}
            {renderDetailItem(
              UserCheck,
              "Email Verified",
              user.isEmailVerified ? "Yes" : "No"
            )}
            {renderDetailItem(
              Shield,
              "Overall Verified",
              user.isVerified ? "Yes" : "No"
            )}
            {renderDetailItem(
              Shield,
              "Verification Completed",
              user.verificationCompleted ? "Yes" : "No"
            )}
            {renderDetailItem(
              Crown,
              "Subscription Active",
              user.subscription?.isActive
                ? `Yes (${user.subscription.planName})`
                : "No"
            )}
            {user.subscription?.expiresAt &&
              renderDetailItem(
                Calendar,
                "Subscription Expires",
                new Date(user.subscription.expiresAt).toLocaleDateString()
              )}
            {renderDetailItem(
              UserX,
              "Disabled by Admin",
              user.isDisabledByAdmin ? "Yes" : "No"
            )}
            {user.isDisabledByAdmin &&
              renderDetailItem(AlertTriangle, "Admin Notes", user.adminNotes)}
          </>
        )}

        {/* Photos */}
        {user.photos &&
          user.photos.length > 0 &&
          renderSection(
            "Photos",
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {user.photos.map((photo, index) => (
                <img
                  key={index}
                  src={getImageUrl(photo)}
                  alt={`User Photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    console.log("Photo failed to load:", photo);
                    e.target.src = "/default-avatar.svg";
                  }}
                />
              ))}
            </div>
          )}

        {/* Verification Documents */}
        {user.verificationDocuments &&
          user.verificationDocuments.length > 0 &&
          renderSection(
            "Verification Documents",
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {user.verificationDocuments.map((doc, index) => (
                <a
                  key={index}
                  href={getImageUrl(doc)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-32 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg shadow-md hover:bg-blue-200 transition-colors"
                >
                  Document {index + 1}
                </a>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default AdminUserDetail;
