import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Briefcase,
  Home,
  Heart,
  Camera,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  X,
  MapPin,
  Shield,
  Eye,
  Mail,
  Phone,
  Calendar,
  Users,
  GraduationCap,
  Building,
  DollarSign,
  Loader2,
} from "lucide-react";
import BackButton from "../../BackButton";
import { useAuth } from "../../../contexts/Chat/AuthContext";
import axios from "axios";
import LoadingSpinner from "../../LoadingSpinner";
import uploadService from "../../../services/uploadService.js";
import { getImageUrl, clearImageCache } from "../../../utils/imageUtils";
import { getTokenInfo } from "../../../utils/tokenUtils";
import { formatDateForInput } from "../../../utils/dateUtils";
import AuthTest from "../../AuthTest";

const CreateProfile = ({ onProfileCreated = () => {} }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    height: "",
    weight: "",
    maritalStatus: "",
    religion: "",
    caste: "",
    motherTongue: "",
    manglik: "",
    bodyType: "",
    complexion: "",
    physicalStatus: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    residentialStatus: "",
    education: "",
    educationDetails: "",
    occupation: "",
    occupationDetails: "",
    annualIncome: "",
    workLocation: "",
    familyType: "",
    familyStatus: "",
    familyValues: "",
    fatherOccupation: "",
    motherOccupation: "",
    siblings: "",
    familyLocation: "",
    diet: "",
    smoking: "",
    drinking: "",
    hobbies: "",
    interests: "",
    aboutMe: "",
    photos: [],
  });
  const navigate = useNavigate();
  const location = useLocation();
  const totalSteps = 6;
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoDeleting, setPhotoDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState({});
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

  // Refs for focusable fields
  const aboutMeRef = useRef(null);
  const photosRef = useRef(null);
  const emailRef = useRef(null);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        try {
          uploadService.revokePreviewUrl(url);
        } catch (error) {
          console.warn("Error revoking preview URL:", error);
        }
      });
    };
  }, [previewUrls]);

  // Cleanup preview URLs periodically to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setPreviewUrls((prev) => {
        const newUrls = { ...prev };
        let hasChanges = false;

        Object.keys(newUrls).forEach((key) => {
          const url = newUrls[key];
          // Only cleanup blob URLs that are older than 5 minutes
          if (url && url.startsWith("blob:")) {
            // For now, we'll keep all blob URLs to prevent the ERR_FILE_NOT_FOUND error
            // They will be cleaned up on component unmount
          }
        });

        return hasChanges ? newUrls : prev;
      });
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  const steps = [
    { id: 1, title: "Personal Info", icon: User },
    { id: 2, title: "Contact & Location", icon: MapPin },
    { id: 3, title: "Professional", icon: Briefcase },
    { id: 4, title: "Family", icon: Home },
    { id: 5, title: "Lifestyle", icon: Heart },
    { id: 6, title: "Photos", icon: Camera },
  ];

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Test authentication before upload
  const testAuthentication = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/me`
      );
      console.log("✅ Authentication test successful:", response.data);
      return true;
    } catch (error) {
      console.error("❌ Authentication test failed:", error);
      return false;
    }
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const file = files[0]; // Only one at a time for now

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Debug: Check authentication
    console.log("👤 User authenticated:", !!user);
    console.log("👤 User ID:", user?._id);

    const token = localStorage.getItem("token");
    const tokenInfo = getTokenInfo(token);
    console.log("🔑 Token info:", tokenInfo);

    // Test authentication before upload
    const isAuthenticated = await testAuthentication();
    if (!isAuthenticated) {
      setError("Authentication failed. Please login again.");
      return;
    }

    setPhotoUploading(true);
    setUploadProgress(0);

    try {
      // Create preview URL
      const previewUrl = uploadService.createPreviewUrl(file);
      setPreviewUrls((prev) => ({ ...prev, [file.name]: previewUrl }));

      // Upload using new service
      const uploadResult = await uploadService.uploadProfilePhoto(
        file,
        setUploadProgress
      );

      console.log("📸 Upload result:", uploadResult);
      console.log("📸 File data:", uploadResult.file);

      // Handle different possible response structures
      let photoUrl;
      if (uploadResult.file && uploadResult.file.url) {
        photoUrl = uploadResult.file.url;
      } else if (uploadResult.file && uploadResult.file.path) {
        photoUrl = uploadResult.file.path;
      } else if (uploadResult.url) {
        photoUrl = uploadResult.url;
      } else {
        console.error("Unexpected upload result structure:", uploadResult);
        setError("Photo upload failed - unexpected response structure");
        return;
      }

      // Validate photoUrl before proceeding
      if (!photoUrl || typeof photoUrl !== "string") {
        console.error("Invalid photo URL received:", photoUrl);
        console.error("Upload result:", uploadResult);
        setError("Photo upload failed - invalid response from server");
        return;
      }

      // Keep the preview URL for immediate display
      setPreviewUrls((prev) => ({ ...prev, [photoUrl]: previewUrl }));

      // Add to loading images set
      setLoadingImages((prev) => new Set([...prev, photoUrl]));

      setProfileData((prev) => ({
        ...prev,
        photos: [...prev.photos, photoUrl].slice(0, 10), // Max 10 photos
      }));

      // Clear cache for the new image
      clearImageCache(getImageUrl(photoUrl));

      // Trigger image refresh event
      const event = new CustomEvent("profileImagesUpdated", {
        detail: { timestamp: Date.now() },
      });
      window.dispatchEvent(event);

      // Don't cleanup preview URL immediately - let it persist until user navigates away
      // The preview URL will be cleaned up when the component unmounts

      // Show success message
      setSuccess("Photo uploaded successfully!");
      setTimeout(() => setSuccess(null), 3000);

      // Force refresh of image display
      setImageRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Photo upload error:", err);
      setError("Photo upload failed");

      // Cleanup preview URL on error
      if (previewUrls[file.name]) {
        uploadService.revokePreviewUrl(previewUrls[file.name]);
        setPreviewUrls((prev) => {
          const newUrls = { ...prev };
          delete newUrls[file.name];
          return newUrls;
        });
      }
    } finally {
      setPhotoUploading(false);
      setUploadProgress(0);
    }
  };

  const removePhoto = async (index) => {
    const photoUrl = profileData.photos[index];
    console.log("🗑️ Removing photo at index:", index);
    console.log("🗑️ Photo URL to delete:", photoUrl);

    setPhotoDeleting(true);
    try {
      // First, call the backend API to remove the photo from user's profile
      const { deletePhoto } = await import("../../../services/userService.js");
      await deletePhoto(photoUrl);
      console.log("✅ Photo removed from user profile");

      // Ensure the filePath is in the correct format for deletion
      let filePath = photoUrl;
      if (photoUrl.startsWith("/uploads/")) {
        filePath = photoUrl;
      } else {
        // If it's a relative path, add /uploads/ prefix
        filePath = `/uploads/${photoUrl}`;
      }
      console.log("🗑️ Formatted filePath for deletion:", filePath);

      // Delete the actual file from server
      await uploadService.deleteFile(filePath);
      console.log("✅ Photo file deleted successfully");

      // Update only the local state by removing the photo at the given index
      setProfileData((prev) => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
      }));

      // Clear cache for the removed image
      clearImageCache(getImageUrl(photoUrl));

      // Trigger image refresh event
      const event = new CustomEvent("profileImagesUpdated", {
        detail: { timestamp: Date.now() },
      });
      window.dispatchEvent(event);

      // Update the user context to reflect the change immediately
      setUser((prev) => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
      }));
    } catch (err) {
      console.error("❌ Photo deletion error:", err);
      setError("Failed to delete photo");
    } finally {
      setPhotoDeleting(false);
    }
  };

  const handlePreviewPhoto = (photoUrl) => {
    const fullUrl = uploadService.getFileUrl(photoUrl);
    window.open(fullUrl, "_blank");
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      // Prepare form data (handle photos if needed)
      const formData = { ...profileData };
      // If you want to handle photo uploads, you may need to use FormData and a separate endpoint
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/users/${user._id}`,
        formData
      );
      setSuccess("Profile updated successfully!");
      onProfileCreated(response.data);

      // Clear image cache for all photos
      if (formData.photos) {
        formData.photos.forEach((photo) => {
          clearImageCache(getImageUrl(photo));
        });
      }

      // Merge submitted changes into user context for instant feedback
      setUser((prev) => ({
        ...prev,
        ...formData,
        hasPendingChanges: true,
      }));
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
    onProfileCreated(profileData);
    navigate("/profile");
  };

  // Focus/scroll logic
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusField = params.get("focus");
    if (focusField) {
      // Map field to step and ref
      const fieldToStep = {
        aboutMe: 5,
        photos: 6,
        email: 2,
        // add more mappings as needed
      };
      const fieldToRef = {
        aboutMe: aboutMeRef,
        photos: photosRef,
        email: emailRef,
        // add more mappings as needed
      };
      const step = fieldToStep[focusField];
      if (step) setCurrentStep(step);
      setTimeout(() => {
        const ref = fieldToRef[focusField];
        if (ref && ref.current) {
          ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
          if (ref.current.focus) ref.current.focus();
        }
      }, 400); // Wait for step to render
    }
    // eslint-disable-next-line
  }, [location.search]);

  useEffect(() => {
    // Fetch user profile and pre-fill form
    const fetchProfile = async () => {
      if (!user || !user._id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/users/${user._id}`
        );
        if (response.data) {
          setProfileData((prev) => ({ ...prev, ...response.data }));
        }
      } catch (err) {
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Personal Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formatDateForInput(profileData.dateOfBirth)}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Gender *
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Height *
                </label>
                <select
                  value={profileData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Height</option>
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

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Weight
                </label>
                <input
                  type="text"
                  value={profileData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your weight in kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Body Type
                </label>
                <select
                  value={profileData.bodyType}
                  onChange={(e) =>
                    handleInputChange("bodyType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Body Type</option>
                  <option value="Slim">Slim</option>
                  <option value="Average">Average</option>
                  <option value="Athletic">Athletic</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Complexion
                </label>
                <select
                  value={profileData.complexion}
                  onChange={(e) =>
                    handleInputChange("complexion", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Complexion</option>
                  <option value="Fair">Fair</option>
                  <option value="Wheatish">Wheatish</option>
                  <option value="Dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Physical Status
                </label>
                <select
                  value={profileData.physicalStatus}
                  onChange={(e) =>
                    handleInputChange("physicalStatus", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Physical Status</option>
                  <option value="Normal">Normal</option>
                  <option value="Physically Challenged">
                    Physically Challenged
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Marital Status *
                </label>
                <select
                  value={profileData.maritalStatus}
                  onChange={(e) =>
                    handleInputChange("maritalStatus", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Status</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Religion *
                </label>
                <select
                  value={profileData.religion}
                  onChange={(e) =>
                    handleInputChange("religion", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Religion</option>
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
                  value={profileData.caste}
                  onChange={(e) => handleInputChange("caste", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your caste"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Manglik
                </label>
                <select
                  value={profileData.manglik}
                  onChange={(e) => handleInputChange("manglik", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Don't Know">Don't Know</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Mother Tongue *
                </label>
                <select
                  value={profileData.motherTongue}
                  onChange={(e) =>
                    handleInputChange("motherTongue", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Language</option>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">
              Contact & Location
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your email"
                  ref={emailRef}
                  readOnly={!!profileData.email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Country *
                </label>
                <select
                  value={profileData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Country</option>
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
                  State *
                </label>
                <input
                  type="text"
                  value={profileData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter your city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Residential Status
                </label>
                <select
                  value={profileData.residentialStatus}
                  onChange={(e) =>
                    handleInputChange("residentialStatus", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Status</option>
                  <option value="Citizen">Citizen</option>
                  <option value="Permanent Resident">Permanent Resident</option>
                  <option value="Work Permit">Work Permit</option>
                  <option value="Student Visa">Student Visa</option>
                  <option value="Temporary Visa">Temporary Visa</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">
              Professional Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Education *
                </label>
                <select
                  value={profileData.education}
                  onChange={(e) =>
                    handleInputChange("education", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Education</option>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Education Details
                </label>
                <input
                  type="text"
                  value={profileData.educationDetails}
                  onChange={(e) =>
                    handleInputChange("educationDetails", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., B.Tech in Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Occupation *
                </label>
                <select
                  value={profileData.occupation}
                  onChange={(e) =>
                    handleInputChange("occupation", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Occupation</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Government Employee">
                    Government Employee
                  </option>
                  <option value="Private Employee">Private Employee</option>
                  <option value="Student">Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Occupation Details
                </label>
                <input
                  type="text"
                  value={profileData.occupationDetails}
                  onChange={(e) =>
                    handleInputChange("occupationDetails", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., Senior Software Developer at Google"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Annual Income
                </label>
                <select
                  value={profileData.annualIncome}
                  onChange={(e) =>
                    handleInputChange("annualIncome", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Income Range</option>
                  <option value="Below ₹2 LPA">Below ₹2 LPA</option>
                  <option value="₹2-5 LPA">₹2-5 LPA</option>
                  <option value="₹5-10 LPA">₹5-10 LPA</option>
                  <option value="₹10-15 LPA">₹10-15 LPA</option>
                  <option value="₹15-25 LPA">₹15-25 LPA</option>
                  <option value="₹25-50 LPA">₹25-50 LPA</option>
                  <option value="Above ₹50 LPA">Above ₹50 LPA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Work Location
                </label>
                <input
                  type="text"
                  value={profileData.workLocation}
                  onChange={(e) =>
                    handleInputChange("workLocation", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter work location"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">
              Family Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Family Type
                </label>
                <select
                  value={profileData.familyType}
                  onChange={(e) =>
                    handleInputChange("familyType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Family Type</option>
                  <option value="Joint Family">Joint Family</option>
                  <option value="Nuclear Family">Nuclear Family</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Family Status
                </label>
                <select
                  value={profileData.familyStatus}
                  onChange={(e) =>
                    handleInputChange("familyStatus", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Status</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Upper Middle Class">Upper Middle Class</option>
                  <option value="Rich">Rich</option>
                  <option value="Affluent">Affluent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Family Values
                </label>
                <input
                  type="text"
                  value={profileData.familyValues}
                  onChange={(e) =>
                    handleInputChange("familyValues", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., Modern, Traditional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Father's Occupation
                </label>
                <input
                  type="text"
                  value={profileData.fatherOccupation}
                  onChange={(e) =>
                    handleInputChange("fatherOccupation", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter father's occupation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Mother's Occupation
                </label>
                <input
                  type="text"
                  value={profileData.motherOccupation}
                  onChange={(e) =>
                    handleInputChange("motherOccupation", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter mother's occupation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Siblings
                </label>
                <input
                  type="text"
                  value={profileData.siblings}
                  onChange={(e) =>
                    handleInputChange("siblings", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., 1 Brother, 1 Sister"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Family Location
                </label>
                <input
                  type="text"
                  value={profileData.familyLocation}
                  onChange={(e) =>
                    handleInputChange("familyLocation", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Enter family location"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">
              Lifestyle & About Me
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Diet
                </label>
                <select
                  value={profileData.diet}
                  onChange={(e) => handleInputChange("diet", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Diet</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Jain Vegetarian">Jain Vegetarian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Smoking
                </label>
                <select
                  value={profileData.smoking}
                  onChange={(e) => handleInputChange("smoking", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Option</option>
                  <option value="Never">Never</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Regularly">Regularly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Drinking
                </label>
                <select
                  value={profileData.drinking}
                  onChange={(e) =>
                    handleInputChange("drinking", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Select Option</option>
                  <option value="Never">Never</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Socially">Socially</option>
                  <option value="Regularly">Regularly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Hobbies
                </label>
                <input
                  type="text"
                  value={profileData.hobbies}
                  onChange={(e) => handleInputChange("hobbies", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., Reading, Traveling, Music"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Interests
                </label>
                <input
                  type="text"
                  value={profileData.interests}
                  onChange={(e) =>
                    handleInputChange("interests", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-black text-black dark:text-white"
                  placeholder="e.g., Technology, Art, Sports"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">
              Upload Photos
            </h3>

            {/* Auth Test Component */}
            <AuthTest />

            <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-xl border border-gray-300 dark:border-gray-600">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-black dark:text-white" />
                <h4 className="text-lg font-semibold text-black dark:text-white">
                  Photo Guidelines
                </h4>
              </div>
              <ul className="text-sm text-black dark:text-white space-y-1">
                <li>• Upload clear, recent photos of yourself</li>
                <li>• Face should be clearly visible</li>
                <li>• No group photos or photos with other people</li>
                <li>• Maximum 10 photos allowed</li>
                <li>• Supported formats: JPG, PNG (Max 5MB each)</li>
              </ul>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-900">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                ref={photosRef}
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-black dark:text-white mb-2">
                  Upload Photos
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click to select photos or drag and drop
                </p>
                {photoUploading && (
                  <div className="flex justify-center mt-4">
                    <LoadingSpinner />
                    <span className="ml-2 text-blue-500">Uploading...</span>
                  </div>
                )}
              </label>
            </div>

            {profileData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profileData.photos
                  .filter((photo) => photo && photo.trim() !== "") // Filter out undefined/null/empty photos
                  .map((photo, index) => (
                    <div
                      key={`${photo}-${index}-${imageRefreshKey}`}
                      className="relative"
                    >
                      {loadingImages.has(photo) && (
                        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      <img
                        src={previewUrls[photo] || getImageUrl(photo, true)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        onLoadStart={() => {
                          // Add to loading set when image starts loading
                          if (photo && !loadingImages.has(photo)) {
                            setLoadingImages(
                              (prev) => new Set([...prev, photo])
                            );
                          }
                        }}
                        onLoad={() => {
                          // Remove from loading set when image loads successfully
                          if (loadingImages.has(photo)) {
                            setLoadingImages((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(photo);
                              return newSet;
                            });
                          }
                          // Don't remove preview URL immediately - let it persist
                          // Only remove if it's been there for a long time
                          if (previewUrls[photo]) {
                            setTimeout(() => {
                              setPreviewUrls((prev) => {
                                const newUrls = { ...prev };
                                delete newUrls[photo];
                                return newUrls;
                              });
                            }, 10000); // Wait 10 seconds before cleaning up preview
                          }
                        }}
                        onError={(e) => {
                          console.log("Image failed to load:", photo);
                          // If the server image fails to load, try the preview URL
                          if (!previewUrls[photo]) {
                            console.log(
                              "Image failed to load, trying preview URL"
                            );
                          }
                          // Retry loading the image after a short delay
                          setTimeout(() => {
                            const img = e.target;
                            if (img && photo) {
                              img.src = getImageUrl(photo, true);
                            }
                          }, 1000);

                          // If the image still fails to load after retry, it might have been deleted
                          // Remove it from the profile data to prevent 404 errors
                          setTimeout(() => {
                            setProfileData((prev) => ({
                              ...prev,
                              photos: prev.photos.filter((p) => p !== photo),
                            }));
                          }, 2000); // Wait 2 seconds before removing
                        }}
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-black dark:bg-white text-white dark:text-black rounded-full p-1 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg"
                        disabled={photoDeleting}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        {/* Header with View Profile Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div className="text-center flex-1 mb-4 sm:mb-0">
            <h1 className="text-3xl lg:text-4xl font-bold text-black dark:text-white mb-2">
              Create Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find your perfect life partner with a complete profile
            </p>
          </div>

          <button
            onClick={handleViewProfile}
            className="flex items-center space-x-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
          >
            <Eye className="w-5 h-5" />
            <span>View Profile</span>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-4 sm:p-6 mb-8 border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all ${
                      isCompleted
                        ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black"
                        : isActive
                        ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black"
                        : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p
                      className={`text-sm font-medium ${
                        isActive
                          ? "text-black dark:text-white"
                          : isCompleted
                          ? "text-black dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Step {step.id}
                    </p>
                    <p
                      className={`text-xs ${
                        isActive
                          ? "text-black dark:text-white"
                          : isCompleted
                          ? "text-black dark:text-white"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-4 sm:w-8 h-0.5 ml-2 sm:ml-4 ${
                        isCompleted
                          ? "bg-black dark:bg-white"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-black dark:bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-4 sm:p-8 mb-8 border border-gray-300 dark:border-gray-700">
          {success && (
            <div className="text-green-600 font-semibold mb-4">{success}</div>
          )}
          {error && (
            <div className="text-red-600 font-semibold mb-4">{error}</div>
          )}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner
                size="lg"
                color="blue"
                text="Loading profile data..."
              />
            </div>
          )}
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-full font-semibold transition-all ${
              currentStep === 1
                ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-gray-600 dark:bg-gray-400 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-4 sm:px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-6 sm:px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              <Check className="w-5 h-5" />
              <span>{loading ? "Saving..." : "Create Profile"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
