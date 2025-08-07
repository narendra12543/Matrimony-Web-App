import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Save,
  Check,
  ArrowLeft,
  Users,
  MapPin,
  GraduationCap,
  Building,
  DollarSign,
  Shield,
  Calendar,
  Edit,
} from "lucide-react";
import BackButton from "../../BackButton";
import { useAuth } from "../../../contexts/Chat/AuthContext";
import axios from "axios";

const PartnerPreferences = () => {
  const [preferences, setPreferences] = useState({
    partnerGender: "",
    partnerAgeMin: "",
    partnerAgeMax: "",
    partnerHeightMin: "",
    partnerHeightMax: "",
    partnerEducation: "",
    partnerOccupation: "",
    partnerIncome: "",
    partnerCountry: "",
    partnerLocation: "",
    partnerReligion: "",
    partnerCaste: "",
    partnerMaritalStatus: "",
    partnerAbout: "",
  });

  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handleInputChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      console.log("📤 Submitting preferences:", preferences);
      console.log("👤 User ID:", user._id);
      console.log(
        "🔗 API URL:",
        `${import.meta.env.VITE_API_URL}/api/v1/users/${user._id}/preferences`
      );

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/users/${user._id}/preferences`,
        preferences,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      console.log("✅ Save response:", response.data);
      setSuccess("Partner preferences saved successfully!");

      // Update user context with new preferences
      setUser((prev) => ({
        ...prev,
        partnerPreferences: preferences,
      }));

      // Show summary view after successful save
      setShowSummary(true);
      setIsEditMode(false);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error(
        "❌ Error saving preferences:",
        err.response?.data || err.message
      );
      setError(err.response?.data?.error || "Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setShowSummary(false);
    setSuccess(null);
    setError(null);
  };

  useEffect(() => {
    // Fetch existing preferences
    const fetchPreferences = async () => {
      if (!user || !user._id) return;
      setLoading(true);
      setError(null);
      try {
        console.log("🔍 Fetching preferences for user:", user._id);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/users/${
            user._id
          }/preferences`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("📥 Response received:", response.data);

        if (response.data && response.data.partnerPreferences) {
          console.log(
            "✅ Setting preferences:",
            response.data.partnerPreferences
          );
          setPreferences(response.data.partnerPreferences);

          // Check if any preferences have meaningful data
          const hasData = Object.values(response.data.partnerPreferences).some(
            (value) => value && value.toString().trim() !== ""
          );

          if (hasData) {
            console.log("✅ Preferences have data, showing summary view");
            // If preferences exist and have data, show summary view
            setShowSummary(true);
            setIsEditMode(false);
          } else {
            console.log(
              "❌ Preferences exist but are empty, showing edit mode"
            );
            // If preferences exist but are empty, show edit mode
            setIsEditMode(true);
            setShowSummary(false);
          }
        } else {
          console.log("❌ No partnerPreferences found in response");
          // If no preferences exist, show edit mode
          setIsEditMode(true);
          setShowSummary(false);
        }
      } catch (err) {
        // If preferences don't exist yet, show edit mode
        console.log(
          "Error fetching preferences:",
          err.response?.data || err.message
        );
        console.log("User ID:", user._id);
        console.log(
          "API URL:",
          `${import.meta.env.VITE_API_URL}/api/v1/users/${user._id}/preferences`
        );
        setIsEditMode(true);
        setShowSummary(false);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, [user]);

  // Helper function to format preference value
  const formatPreferenceValue = (value) => {
    if (!value || value === "") return "Not specified";
    return value;
  };

  // Summary view component
  const renderSummaryView = () => {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-500 mr-3" />
            <h2 className="text-2xl lg:text-3xl font-bold text-black dark:text-white">
              Your Partner Preferences
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Here's a summary of your partner preferences
          </p>
        </div>

        {/* Basic Preferences Summary */}
        <div className="bg-white dark:bg-black rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Basic Preferences
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Gender:
              </span>
              <p className="text-black dark:text-white">
                {formatPreferenceValue(preferences.partnerGender)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Age Range:
              </span>
              <p className="text-black dark:text-white">
                {preferences.partnerAgeMin && preferences.partnerAgeMax
                  ? `${preferences.partnerAgeMin} - ${preferences.partnerAgeMax} years`
                  : formatPreferenceValue(
                      preferences.partnerAgeMin || preferences.partnerAgeMax
                    )}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Height Range:
              </span>
              <p className="text-black dark:text-white">
                {preferences.partnerHeightMin && preferences.partnerHeightMax
                  ? `${preferences.partnerHeightMin} - ${preferences.partnerHeightMax}`
                  : formatPreferenceValue(
                      preferences.partnerHeightMin ||
                        preferences.partnerHeightMax
                    )}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Marital Status:
              </span>
              <p className="text-black dark:text-white">
                {formatPreferenceValue(preferences.partnerMaritalStatus)}
              </p>
            </div>
          </div>
        </div>

        {/* Professional Preferences Summary */}
        <div className="bg-white dark:bg-black rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center">
            <GraduationCap className="w-6 h-6 mr-2 text-green-600" />
            Professional Preferences
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Education:
              </span>
              <p className="text-black dark:text-white">
                {formatPreferenceValue(preferences.partnerEducation)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Occupation:
              </span>
              <p className="text-black dark:text-white">
                {formatPreferenceValue(preferences.partnerOccupation)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Annual Income:
              </span>
              <p className="text-black dark:text-white">
                {formatPreferenceValue(preferences.partnerIncome)}
              </p>
            </div>
          </div>
        </div>

        {/* Location Preferences Summary */}
        <div className="bg-white dark:bg-black rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-purple-600" />
            Location Preferences
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Country:
              </span>
              <p className="text-black dark:text-white">
                {formatPreferenceValue(preferences.partnerCountry)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                State:
              </span>
              <p className="text-black dark:text-white">
                {formatPreferenceValue(preferences.partnerLocation)}
              </p>
            </div>
          </div>
        </div>

        {/* Religious & Cultural Preferences Summary */}
        <div className="bg-white dark:bg-black rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-orange-600" />
            Religious & Cultural Preferences
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Religion:
              </span>
              <p className="text-black dark:text-white">
                {formatPreferenceValue(preferences.partnerReligion)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Caste:
              </span>
              <p className="text-black dark:text-white">
                {formatPreferenceValue(preferences.partnerCaste)}
              </p>
            </div>
          </div>
        </div>

        {/* About Partner Summary */}
        {preferences.partnerAbout && (
          <div className="bg-white dark:bg-black rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center">
              <Heart className="w-6 h-6 mr-2 text-red-600" />
              About Your Ideal Partner
            </h3>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Description:
              </span>
              <p className="text-black dark:text-white mt-2 leading-relaxed">
                {preferences.partnerAbout}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              <h1 className="text-3xl lg:text-4xl font-bold text-black dark:text-white">
                Partner Preferences
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Set your preferences to find your perfect life partner
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-4 sm:p-8 mb-8 border border-gray-300 dark:border-gray-700">
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    {success}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                <span className="text-red-800 dark:text-red-200 font-medium">
                  {error}
                </span>
              </div>
            )}

            {loading && (
              <div className="text-center py-4">Loading preferences...</div>
            )}

            {!loading && (
              <>
                {showSummary ? (
                  renderSummaryView()
                ) : (
                  <div className="space-y-8">
                    {/* Basic Preferences */}
                    <div>
                      <h3 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center">
                        <Users className="w-6 h-6 mr-2 text-blue-600" />
                        Basic Preferences
                      </h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Preferred Gender
                          </label>
                          <select
                            value={preferences.partnerGender}
                            onChange={(e) =>
                              handleInputChange("partnerGender", e.target.value)
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                          >
                            <option value="">Any Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Age Range
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={preferences.partnerAgeMin}
                              onChange={(e) =>
                                handleInputChange(
                                  "partnerAgeMin",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                              placeholder="Min Age"
                              min="18"
                              max="80"
                            />
                            <input
                              type="number"
                              value={preferences.partnerAgeMax}
                              onChange={(e) =>
                                handleInputChange(
                                  "partnerAgeMax",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                              placeholder="Max Age"
                              min="18"
                              max="80"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Height Range
                          </label>
                          <div className="flex space-x-2">
                            <select
                              value={preferences.partnerHeightMin}
                              onChange={(e) =>
                                handleInputChange(
                                  "partnerHeightMin",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                            >
                              <option value="">Min Height</option>
                              <option value="4'6&quot;">4'6"</option>
                              <option value="4'7&quot;">4'7"</option>
                              <option value="4'8&quot;">4'8"</option>
                              <option value="4'9&quot;">4'9"</option>
                              <option value="4'10&quot;">4'10"</option>
                              <option value="4'11&quot;">4'11"</option>
                              <option value="5'0&quot;">5'0"</option>
                              <option value="5'1&quot;">5'1"</option>
                              <option value="5'2&quot;">5'2"</option>
                              <option value="5'3&quot;">5'3"</option>
                              <option value="5'4&quot;">5'4"</option>
                              <option value="5'5&quot;">5'5"</option>
                              <option value="5'6&quot;">5'6"</option>
                              <option value="5'7&quot;">5'7"</option>
                              <option value="5'8&quot;">5'8"</option>
                              <option value="5'9&quot;">5'9"</option>
                              <option value="5'10&quot;">5'10"</option>
                              <option value="5'11&quot;">5'11"</option>
                              <option value="6'0&quot;">6'0"</option>
                              <option value="6'1&quot;">6'1"</option>
                              <option value="6'2&quot;">6'2"</option>
                              <option value="6'3&quot;">6'3"</option>
                              <option value="6'4&quot;">6'4"</option>
                            </select>
                            <select
                              value={preferences.partnerHeightMax}
                              onChange={(e) =>
                                handleInputChange(
                                  "partnerHeightMax",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                            >
                              <option value="">Max Height</option>
                              <option value="4'6&quot;">4'6"</option>
                              <option value="4'7&quot;">4'7"</option>
                              <option value="4'8&quot;">4'8"</option>
                              <option value="4'9&quot;">4'9"</option>
                              <option value="4'10&quot;">4'10"</option>
                              <option value="4'11&quot;">4'11"</option>
                              <option value="5'0&quot;">5'0"</option>
                              <option value="5'1&quot;">5'1"</option>
                              <option value="5'2&quot;">5'2"</option>
                              <option value="5'3&quot;">5'3"</option>
                              <option value="5'4&quot;">5'4"</option>
                              <option value="5'5&quot;">5'5"</option>
                              <option value="5'6&quot;">5'6"</option>
                              <option value="5'7&quot;">5'7"</option>
                              <option value="5'8&quot;">5'8"</option>
                              <option value="5'9&quot;">5'9"</option>
                              <option value="5'10&quot;">5'10"</option>
                              <option value="5'11&quot;">5'11"</option>
                              <option value="6'0&quot;">6'0"</option>
                              <option value="6'1&quot;">6'1"</option>
                              <option value="6'2&quot;">6'2"</option>
                              <option value="6'3&quot;">6'3"</option>
                              <option value="6'4&quot;">6'4"</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Marital Status
                          </label>
                          <select
                            value={preferences.partnerMaritalStatus}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerMaritalStatus",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                          >
                            <option value="">Any Status</option>
                            <option value="Never Married">Never Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Separated">Separated</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Professional Preferences */}
                    <div>
                      <h3 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center">
                        <GraduationCap className="w-6 h-6 mr-2 text-green-600" />
                        Professional Preferences
                      </h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Education
                          </label>
                          <select
                            value={preferences.partnerEducation}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerEducation",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                          >
                            <option value="">Any Education</option>
                            <option value="High School">High School</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Bachelor's">Bachelor's</option>
                            <option value="Master's">Master's</option>
                            <option value="PhD">PhD</option>
                            <option value="Professional">Professional</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Occupation
                          </label>
                          <select
                            value={preferences.partnerOccupation}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerOccupation",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                          >
                            <option value="">Any Occupation</option>
                            <option value="Software Engineer">
                              Software Engineer
                            </option>
                            <option value="Doctor">Doctor</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Business Owner">
                              Business Owner
                            </option>
                            <option value="Government Employee">
                              Government Employee
                            </option>
                            <option value="Private Employee">
                              Private Employee
                            </option>
                            <option value="Student">Student</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Annual Income
                          </label>
                          <select
                            value={preferences.partnerIncome}
                            onChange={(e) =>
                              handleInputChange("partnerIncome", e.target.value)
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                          >
                            <option value="">Any Income Range</option>
                            <option value="Below ₹2 LPA">Below ₹2 LPA</option>
                            <option value="₹2-5 LPA">₹2-5 LPA</option>
                            <option value="₹5-10 LPA">₹5-10 LPA</option>
                            <option value="₹10-15 LPA">₹10-15 LPA</option>
                            <option value="₹15-25 LPA">₹15-25 LPA</option>
                            <option value="₹25-50 LPA">₹25-50 LPA</option>
                            <option value="Above ₹50 LPA">Above ₹50 LPA</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Location Preferences */}
                    <div>
                      <h3 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center">
                        <MapPin className="w-6 h-6 mr-2 text-purple-600" />
                        Location Preferences
                      </h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Country
                          </label>
                          <select
                            value={preferences.partnerCountry}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerCountry",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                          >
                            <option value="">Any Country</option>
                            <option value="India">India</option>
                            <option value="USA">USA</option>
                            <option value="UK">UK</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            State
                          </label>
                          <select
                            value={preferences.partnerLocation}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerLocation",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                          >
                            <option value="">Any State</option>
                            <option value="Andhra Pradesh">
                              Andhra Pradesh
                            </option>
                            <option value="Arunachal Pradesh">
                              Arunachal Pradesh
                            </option>
                            <option value="Assam">Assam</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Chhattisgarh">Chhattisgarh</option>
                            <option value="Goa">Goa</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Himachal Pradesh">
                              Himachal Pradesh
                            </option>
                            <option value="Jharkhand">Jharkhand</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Madhya Pradesh">
                              Madhya Pradesh
                            </option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Manipur">Manipur</option>
                            <option value="Meghalaya">Meghalaya</option>
                            <option value="Mizoram">Mizoram</option>
                            <option value="Nagaland">Nagaland</option>
                            <option value="Odisha">Odisha</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Sikkim">Sikkim</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Tripura">Tripura</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Uttarakhand">Uttarakhand</option>
                            <option value="West Bengal">West Bengal</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Religious & Cultural Preferences */}
                    <div>
                      <h3 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center">
                        <Shield className="w-6 h-6 mr-2 text-orange-600" />
                        Religious & Cultural Preferences
                      </h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Religion
                          </label>
                          <select
                            value={preferences.partnerReligion}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerReligion",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                          >
                            <option value="">Any Religion</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Muslim">Muslim</option>
                            <option value="Christian">Christian</option>
                            <option value="Sikh">Sikh</option>
                            <option value="Buddhist">Buddhist</option>
                            <option value="Jain">Jain</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white mb-2">
                            Caste
                          </label>
                          <input
                            type="text"
                            value={preferences.partnerCaste}
                            onChange={(e) =>
                              handleInputChange("partnerCaste", e.target.value)
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                            placeholder="Preferred caste (e.g., Any, Brahmin, Rajput)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* About Partner */}
                    <div>
                      <h3 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center">
                        <Heart className="w-6 h-6 mr-2 text-red-600" />
                        About Your Ideal Partner
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-2">
                          Describe your ideal partner
                        </label>
                        <textarea
                          value={preferences.partnerAbout}
                          onChange={(e) =>
                            handleInputChange("partnerAbout", e.target.value)
                          }
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                          placeholder="Describe your ideal partner, what qualities you're looking for, lifestyle preferences, etc..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 dark:bg-gray-400 text-white dark:text-black rounded-full font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          {showSummary ? (
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Edit className="w-5 h-5" />
              <span>Edit Preferences</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? "Saving..." : "Save Preferences"}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default PartnerPreferences;
