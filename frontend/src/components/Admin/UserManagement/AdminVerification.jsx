import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Camera,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import LoadingSpinner from "../../LoadingSpinner";
import { getImageUrl } from "../../../utils/imageUtils";

const AdminVerification = () => {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState("all");
  const [expandedRequests, setExpandedRequests] = useState({});
  const [rejectReason, setRejectReason] = useState({});

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem("adminToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/verification`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setVerificationRequests(response.data);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      toast.error("Failed to fetch verification requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verificationId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [verificationId]: true }));
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/verification/${verificationId}`,
        { status: "approved" },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setVerificationRequests(
        verificationRequests.filter((req) => req._id !== verificationId)
      );
      toast.success("Verification approved successfully!");
    } catch (error) {
      console.error("Error approving verification:", error);
      toast.error("Failed to approve verification.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [verificationId]: false }));
    }
  };

  const handleReject = async (verificationId) => {
    const reason = rejectReason[verificationId];
    if (!reason || reason.trim() === "") {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [verificationId]: true }));
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/verification/${verificationId}`,
        {
          status: "rejected",
          adminNotes: reason,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setVerificationRequests(
        verificationRequests.filter((req) => req._id !== verificationId)
      );
      setRejectReason((prev) => ({ ...prev, [verificationId]: "" }));
      toast.success("Verification rejected successfully!");
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast.error("Failed to reject verification.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [verificationId]: false }));
    }
  };

  const toggleExpanded = (requestId) => {
    setExpandedRequests((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "Not specified";
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
    return `${age} years`;
  };

  const filteredRequests = verificationRequests.filter((request) => {
    if (filter === "all") return true;
    return request.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_review":
        return (
          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case "auto_approved":
        return (
          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Auto Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score) => {
    if (score <= 3) return "text-green-600 bg-green-100";
    if (score <= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Document Verification Requests
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and approve user document verifications with complete profile
          information
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg ${
            filter === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Requests
        </button>
        <button
          onClick={() => setFilter("pending_review")}
          className={`px-4 py-2 rounded-lg ${
            filter === "pending_review"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setFilter("auto_approved")}
          className={`px-4 py-2 rounded-lg ${
            filter === "auto_approved"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Auto Approved
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-lg ${
            filter === "rejected"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Rejected
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner
            size="lg"
            color="blue"
            text="Loading verification requests..."
          />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Shield className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            No verification requests found
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((request) => (
            <div
              key={request._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header Section */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400 bg-gray-200 flex-shrink-0 flex items-center justify-center">
                      {request.user?.photos?.[0] ? (
                        <img
                          src={getImageUrl(request.user.photos[0])}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {request.user?.firstName} {request.user?.lastName}
                        {getStatusBadge(request.status)}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.user?.email} • {request.documentType}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {calculateAge(request.user?.dateOfBirth)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {request.user?.gender || "Not specified"}
                        </span>
                        {request.user?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {request.user.city}, {request.user.state}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${getScoreColor(
                        request.vulnerabilityScore
                      )}`}
                    >
                      Score: {request.vulnerabilityScore}/10
                    </div>
                    <button
                      onClick={() => toggleExpanded(request._id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedRequests[request._id] ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                {request.status === "pending_review" && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleApprove(request._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      disabled={actionLoading[request._id]}
                    >
                      {actionLoading[request._id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Rejection reason..."
                        value={rejectReason[request._id] || ""}
                        onChange={(e) =>
                          setRejectReason((prev) => ({
                            ...prev,
                            [request._id]: e.target.value,
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        onClick={() => handleReject(request._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                        disabled={actionLoading[request._id]}
                      >
                        {actionLoading[request._id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Content */}
              {expandedRequests[request._id] && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Profile Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Information
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Name
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {request.user?.firstName} {request.user?.lastName}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Age
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {calculateAge(request.user?.dateOfBirth)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Gender
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {request.user?.gender || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Marital Status
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {request.user?.maritalStatus || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Religion
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {request.user?.religion || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Caste
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {request.user?.caste || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Education
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {request.user?.education || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Occupation
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {request.user?.occupation || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Annual Income
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {request.user?.annualIncome || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Location
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {request.user?.city}, {request.user?.state}
                          </p>
                        </div>
                      </div>

                      {/* Profile Photos */}
                      {request.user?.photos &&
                        request.user.photos.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                              <Camera className="w-4 h-4" />
                              Profile Photos
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {request.user.photos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={getImageUrl(photo)}
                                  alt={`Profile photo ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Verification Documents */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Verification Documents
                      </h3>

                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                          Front Document ({request.documentType})
                        </label>
                        <img
                          src={getImageUrl(request.documentFrontPath)}
                          alt="Front document"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        />
                      </div>

                      {request.documentBackPath && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">
                            Back Document
                          </label>
                          <img
                            src={getImageUrl(request.documentBackPath)}
                            alt="Back document"
                            className="w-full h-48 object-cover rounded-lg border border-gray-300"
                          />
                        </div>
                      )}

                      {/* Extracted Data */}
                      {request.extractedData &&
                        Object.keys(request.extractedData).length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">
                              Extracted Information
                            </label>
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {Object.entries(request.extractedData).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex justify-between py-1"
                                  >
                                    <span className="text-sm font-medium text-gray-600 capitalize">
                                      {key.replace(/([A-Z])/g, " $1").trim()}:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white">
                                      {value}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerification;
