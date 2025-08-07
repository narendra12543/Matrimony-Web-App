import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/Chat/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/users/profile-completion/${
          user._id
        }`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCompletion(res.data.completion);
      setMissingFields(res.data.missingFields);
    } catch (err) {
      setError("Failed to fetch profile completion.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldClick = (field) => {
    navigate(`/profile?focus=${field}`);
  };

  // Example mapping for some common fields
  const fieldLabels = {
    photos: "Upload More Photos",
    partnerPreferences: "Add Partner Preferences",
    isVerified: "Verify Email/Phone",
    aboutMe: "Add About Me",
    // Add more mappings as needed
    firstName: "Add First Name",
    lastName: "Add Last Name",
    dateOfBirth: "Add Date of Birth",
    gender: "Add Gender",
    height: "Add Height",
    maritalStatus: "Add Marital Status",
    religion: "Add Religion",
    motherTongue: "Add Mother Tongue",
    email: "Add Email",
    phone: "Add Phone Number",
    country: "Add Country",
    state: "Add State",
    city: "Add City",
    education: "Add Education",
    occupation: "Add Occupation",
    familyType: "Add Family Type",
    diet: "Add Diet",
    partnerAgeMin: "Add Partner Age Preference",
    partnerHeightMin: "Add Partner Height Preference",
    partnerEducation: "Add Partner Education Preference",
    partnerOccupation: "Add Partner Occupation Preference",
    partnerIncome: "Add Partner Income Preference",
    partnerCountry: "Add Partner Country Preference",
    partnerLocation: "Add Partner State Preference",
    partnerReligion: "Add Partner Religion Preference",
    partnerMaritalStatus: "Add Partner Marital Status Preference",
  };

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg dark:shadow-xl w-full h-full border border-gray-100 dark:border-gray-800">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-3">
        <span className="text-xl sm:text-2xl">🎯</span>
        Profile Completion
      </h2>

      {/* Progress Bar */}
      <div className="w-full h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 sm:mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 relative"
          style={{ width: `${completion}%` }}
        >
          <div className="absolute right-0 top-0 h-full w-1 sm:w-2 bg-white dark:bg-gray-300 opacity-30 animate-pulse"></div>
        </div>
      </div>
      <div className="text-center mb-4 sm:mb-6">
        <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          {completion}%
        </span>
        <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm sm:text-base">
          Complete
        </span>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      ) : error ? (
        <div className="text-center text-red-500 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-600 scrollbar-track-blue-50 dark:scrollbar-track-gray-800 pr-1">
          {missingFields.length === 0 ? (
            <div className="text-green-600 dark:text-green-400 font-semibold text-center">
              Profile is complete!
            </div>
          ) : (
            missingFields.map((field, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleFieldClick(field)}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-102 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <span className="text-xl sm:text-2xl w-6 sm:w-8 text-center text-orange-500">
                  ⚠️
                </span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-200 font-medium flex-1">
                  {fieldLabels[field] ||
                    field
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-sm sm:text-base">
                  →
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default ProfileCompletion;
