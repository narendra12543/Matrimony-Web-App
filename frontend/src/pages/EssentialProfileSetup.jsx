import React, { useState, useEffect } from "react";
import {
  User,
  Heart,
  Calendar,
  MapPin,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Star,
  Users,
  Target,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/Chat/AuthContext";

const EssentialProfileSetup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    gender: "",
    partnerGender: "",
    dateOfBirth: "",
    partnerAgeMin: "",
    partnerAgeMax: "",
    country: "",
    state: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [animateIn, setAnimateIn] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    setAnimateIn(true);

    // Debug: Check token on component mount
    const token = localStorage.getItem("token");
    console.log(
      "🔑 EssentialProfileSetup mounted - Token exists:",
      token ? "Yes" : "No"
    );
    if (token) {
      console.log("🔑 Token value:", token.substring(0, 20) + "...");
    }
  }, []);

  const steps = [
    {
      id: 0,
      title: "About You",
      subtitle: "Tell us about yourself",
      icon: User,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: 1,
      title: "Partner Preferences",
      subtitle: "What you're looking for",
      icon: Heart,
      color: "from-pink-500 to-pink-600",
    },
    {
      id: 2,
      title: "Location",
      subtitle: "Where you're based",
      icon: MapPin,
      color: "from-green-500 to-green-600",
    },
  ];

  const countries = [
    "India",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "South Korea",
    "Singapore",
  ];

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.gender && formData.dateOfBirth;
      case 1:
        return (
          formData.partnerGender &&
          formData.partnerAgeMin &&
          formData.partnerAgeMax
        );
      case 2:
        return formData.country && formData.state;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields");
      return;
    }

    setAnimateOut(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      setAnimateOut(false);
      setAnimateIn(true);
      setError("");
    }, 300);
  };

  const handlePrev = () => {
    setAnimateOut(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setAnimateOut(false);
      setAnimateIn(true);
      setError("");
    }, 300);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    // Debug: Check if token exists
    const token = localStorage.getItem("token");
    console.log(
      "🔑 Token from localStorage:",
      token ? "Token exists" : "No token"
    );
    console.log(
      "🔑 Token value:",
      token ? token.substring(0, 20) + "..." : "No token"
    );

    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("📤 Sending essential profile data:", formData);
      console.log(
        "🌐 API URL:",
        `${import.meta.env.VITE_API_URL}/api/v1/users/essential-profile`
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/essential-profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      console.log("📥 Response status:", response.status);
      const data = await response.json();
      console.log("📥 Response data:", data);

      if (response.ok) {
        // Show success animation
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const Icon = step.icon;

    return (
      <div
        className={`transition-all duration-500 ${
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        } ${animateOut ? "opacity-0 -translate-y-4" : ""}`}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div
              className={`bg-gradient-to-r ${step.color} p-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300`}
            >
              <Icon className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-2">
            {step.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {step.subtitle}
          </p>
        </div>

        <div className="space-y-6">
          {currentStep === 0 && (
            <>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Your Gender *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {["Male", "Female"].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => handleInputChange("gender", gender)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        formData.gender === gender
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <User className="w-5 h-5" />
                        <span className="font-medium">{gender}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Looking for *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {["Male", "Female"].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => handleInputChange("partnerGender", gender)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        formData.partnerGender === gender
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300"
                          : "border-gray-200 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-600"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Heart className="w-5 h-5" />
                        <span className="font-medium">{gender}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Minimum Age *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="18"
                      max="80"
                      value={formData.partnerAgeMin}
                      onChange={(e) =>
                        handleInputChange("partnerAgeMin", e.target.value)
                      }
                      placeholder="18"
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Maximum Age *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="18"
                      max="80"
                      value={formData.partnerAgeMax}
                      onChange={(e) =>
                        handleInputChange("partnerAgeMax", e.target.value)
                      }
                      placeholder="35"
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Country *
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      handleInputChange("country", e.target.value);
                      handleInputChange("state", ""); // Reset state when country changes
                    }}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  State/Province *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white"
                    required
                    disabled={!formData.country}
                  >
                    <option value="">Select State</option>
                    {formData.country === "India" &&
                      indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    {formData.country && formData.country !== "India" && (
                      <option value="Other">Other</option>
                    )}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-pink-300 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-green-200 to-green-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 via-pink-500 to-green-500 p-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <Sparkles className="w-10 h-10 text-white fill-white animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-pink-500 to-green-500 rounded-2xl blur-md opacity-30 -z-10"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-pink-900 bg-clip-text text-transparent dark:from-white dark:via-gray-200 dark:to-gray-400 mb-3">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
            Help us find your perfect match
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    index <= currentStep
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-400"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-all duration-300 ${
                      index < currentStep
                        ? "bg-blue-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-blue-50/30 dark:from-gray-700/50 dark:to-gray-800/30 rounded-3xl"></div>

          <div className="relative z-10">
            {renderStepContent()}

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <Star className="w-5 h-5 mr-2" />
                      Complete Setup
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Success Animation */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Profile Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Redirecting to your dashboard...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EssentialProfileSetup;
