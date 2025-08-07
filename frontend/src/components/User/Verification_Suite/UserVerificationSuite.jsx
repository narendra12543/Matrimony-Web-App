import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  Shield,
  UploadCloud,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import { useAuth } from "../../../contexts/Chat/AuthContext"; // <-- Import useAuth
import uploadService from "../../../services/uploadService.js";

const API_URL = import.meta.env.VITE_API_URL; // Your backend URL

// --- Main Component ---
export default function UserVerificationSuite() {
  const { user } = useAuth(); // <-- Get user from context
  const SUBSCRIBER_ID = user?.subscriberId; // <-- Use subscriberId from user

  // Debug logging
  console.log("🔍 UserVerificationSuite - User object:", user);
  console.log("🔍 UserVerificationSuite - SUBSCRIBER_ID:", SUBSCRIBER_ID);

  // Add a function to refresh user data
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("🔍 No token found");
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("🔍 Refreshed user data:", data);

      if (data.user) {
        // Update the user in context
        window.location.reload(); // Simple refresh for now
      }
    } catch (error) {
      console.error("🔍 Error refreshing user data:", error);
    }
  };

  const [activeStep, setActiveStep] = useState("welcome"); // welcome, email, phone, documentUpload, success
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState("Aadhaar Card");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Add verificationState to track backend status
  const [verificationState, setVerificationState] = useState({
    status: null, // 'auto_approved', 'pending_review', 'approved', 'rejected', etc.
    verificationId: null,
  });

  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false,
    document: false,
  });

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        uploadService.revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  const verificationSteps = useMemo(
    () => [
      {
        id: "documentUpload",
        label: "ID Document Verification",
        completed: verificationStatus.document,
        icon: Shield,
      },
    ],
    [verificationStatus]
  );

  const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

  // Fetch latest verification status on mount
  useEffect(() => {
    const fetchVerification = async () => {
      if (!SUBSCRIBER_ID) return;
      try {
        const res = await axios.get(
          `${API_URL}/api/v1/verification?subscriberId=${SUBSCRIBER_ID}`
        );
        // Assume backend returns an array of verifications, pick the latest
        const latest =
          res.data && res.data.length > 0
            ? res.data[res.data.length - 1]
            : null;
        if (latest) {
          setVerificationState({
            status: latest.status,
            verificationId: latest._id,
          });
          setVerificationStatus((prev) => ({
            ...prev,
            document:
              latest.status === "auto_approved" || latest.status === "approved",
          }));
        }
      } catch (err) {
        // Ignore error, treat as unverified
      }
    };
    fetchVerification();
  }, [SUBSCRIBER_ID]);

  const handleDocumentSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setStatusMessage({
        type: "error",
        text: "Please select a valid file type (JPEG, PNG, WebP, or PDF).",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "File size must be less than 5MB.",
      });
      return;
    }

    setDocumentFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = uploadService.createPreviewUrl(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    setStatusMessage({
      type: "success",
      text: "Document selected successfully.",
    });
  };

  const handleDocumentUpload = async () => {
    if (!documentFile) {
      setStatusMessage({
        type: "error",
        text: "Please select a file to upload.",
      });
      return;
    }
    if (!SUBSCRIBER_ID) {
      setStatusMessage({
        type: "error",
        text: "Your account is missing a subscriber profile. Please contact support.",
      });
      return;
    }
    if (!isValidObjectId(SUBSCRIBER_ID)) {
      setStatusMessage({
        type: "error",
        text: "Invalid subscriber ID format. Please contact support.",
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setStatusMessage({
      type: "info",
      text: "Uploading and analyzing document... This may take a moment.",
    });

    try {
      // Create FormData for verification upload
      const formData = new FormData();
      formData.append("documentFront", documentFile);
      formData.append("subscriberId", SUBSCRIBER_ID);
      formData.append("documentType", documentType);

      // Upload directly to verification endpoint
      const response = await axios.post(
        `${API_URL}/api/v1/verification`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );

      const isAutoApproved =
        response.data.verification?.status === "auto_approved";
      setStatusMessage({
        type: "success",
        text: response.data.message,
      });
      setVerificationStatus((prev) => ({
        ...prev,
        document: isAutoApproved,
      }));
      // Update verificationState after upload
      setVerificationState({
        status: response.data.verification?.status,
        verificationId: response.data.verification?._id,
      });
      setTimeout(() => setActiveStep("success"), 2000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "An unknown error occurred.";
      setStatusMessage({
        type: "error",
        text: `Verification failed: ${errorMsg}`,
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handlePreviewDocument = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  const handleRemoveDocument = () => {
    setDocumentFile(null);
    if (previewUrl) {
      uploadService.revokePreviewUrl(previewUrl);
      setPreviewUrl(null);
    }
    setStatusMessage({ type: "", text: "" });
  };

  // UI logic for disabling upload
  const isVerified =
    verificationState.status === "auto_approved" ||
    verificationState.status === "approved";
  const isPending = verificationState.status === "pending_review";

  const renderStepContent = () => {
    switch (activeStep) {
      case "welcome":
        if (isVerified) {
          return (
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h1 className="text-3xl font-bold text-gray-800 mt-4">
                Verified!
              </h1>
              <p className="text-gray-600 mt-2">
                Your documents have been successfully verified and approved.
              </p>
            </div>
          );
        } else if (isPending) {
          return (
            <div className="text-center">
              <Loader2 className="mx-auto h-16 w-16 text-yellow-500 animate-spin" />
              <h1 className="text-3xl font-bold text-gray-800 mt-4">
                Under Review
              </h1>
              <p className="text-gray-600 mt-2">
                Your documents are being reviewed by our team.
              </p>
            </div>
          );
        } else {
          return (
            <div className="text-center">
              <Shield className="mx-auto h-16 w-16 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-800 mt-4">
                Verify Your Identity
              </h1>
              <p className="text-gray-600 mt-2">
                Upload a valid government-issued ID to verify your profile.
              </p>
              <button
                onClick={() => setActiveStep("documentUpload")}
                className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                Start Verification
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          );
        }

      case "documentUpload":
        return (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <Shield className="mx-auto h-12 w-12 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800 mt-4">
                Upload ID Document
              </h2>
              <p className="text-gray-600 mt-2">
                Please upload a clear photo or scan of your government-issued
                ID.
              </p>
            </div>

            {/* Document Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Driver License">Driver License</option>
              </select>
            </div>

            {/* File Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {!documentFile ? (
                  <div>
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to select or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPEG, PNG, WebP, or PDF (max 5MB)
                    </p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={handleDocumentSelect}
                      className="hidden"
                      id="document-upload"
                    />
                    <label
                      htmlFor="document-upload"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    >
                      Select File
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-8 w-8 text-blue-500" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {documentFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {previewUrl && (
                          <button
                            onClick={handlePreviewDocument}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                        <button
                          onClick={handleRemoveDocument}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Remove"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {isLoading && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                          <span className="text-sm text-gray-600">
                            Uploading... {uploadProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            {statusMessage.text && (
              <div
                className={`p-3 rounded-lg mb-4 ${
                  statusMessage.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : statusMessage.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleDocumentUpload}
              disabled={!documentFile || isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                !documentFile || isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Uploading...
                </div>
              ) : (
                "Upload Document"
              )}
            </button>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="text-3xl font-bold text-gray-800 mt-4">
              Upload Successful!
            </h1>
            <p className="text-gray-600 mt-2">
              Your document has been uploaded and is being processed.
            </p>
            <button
              onClick={() => setActiveStep("welcome")}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Verification
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col md:flex-row bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-1/3 p-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Verification Steps
        </h2>
        <ul className="space-y-1">
          {verificationSteps.map(({ id, label, completed, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => setActiveStep(id)}
                className={`w-full flex items-center p-2 rounded-lg text-left transition-all duration-200 ${
                  activeStep === id
                    ? "bg-blue-100/70 dark:bg-blue-900/30"
                    : "hover:bg-gray-100/60 dark:hover:bg-gray-800/50"
                }`}
                disabled={isVerified || isPending}
              >
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full mr-2 transition-all duration-300 ${
                    completed ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {completed ? (
                    <CheckCircle className="text-white" size={15} />
                  ) : (
                    <Icon className="text-gray-500" size={15} />
                  )}
                </div>
                <span
                  className={`font-medium text-sm ${
                    completed
                      ? "text-gray-800 dark:text-gray-100"
                      : "text-gray-500 dark:text-gray-400"
                  } ${
                    activeStep === id ? "text-blue-700 dark:text-blue-300" : ""
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="w-full md:w-2/3 p-5 md:p-7 flex flex-col justify-center relative bg-white dark:bg-gray-900">
        <div className="transition-all duration-500 ease-in-out">
          {renderStepContent()}
        </div>
        {statusMessage.text && (
          <div
            className={`mt-3 text-center text-xs font-medium ${
              statusMessage.type === "success"
                ? "text-green-600"
                : statusMessage.type === "error"
                ? "text-red-600"
                : "text-blue-600"
            }`}
          >
            {statusMessage.text}
          </div>
        )}
      </main>
    </div>
  );
}
