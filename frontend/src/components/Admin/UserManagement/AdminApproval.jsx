import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Loader2,
  User,
  CheckCircle,
  XCircle,
  Camera,
  AlertTriangle,
  Pencil,
  UserCheck,
  UserPlus,
  Eye,
  EyeOff,
  ArrowRight,
  Clock,
} from "lucide-react";
import LoadingSpinner from "../../LoadingSpinner";
import { getImageUrl } from "../../../utils/imageUtils";

const AdminApproval = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // Track loading for individual actions
  const [filter, setFilter] = useState("all"); // 'all', 'photos', 'profile'
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [showReject, setShowReject] = useState({});
  const [modal, setModal] = useState({
    open: false,
    userId: null,
    action: null,
  });
  const [enlargePhoto, setEnlargePhoto] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState({});

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setLoading(true);
        const adminToken = localStorage.getItem("adminToken");
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/api/v1/admin/approvals/profile-changes`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
        setPendingApprovals(response.data);
      } catch (error) {
        console.error("Error fetching pending approvals:", error);
        toast.error("Failed to fetch pending approvals.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  const handleApprove = async (userId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [userId]: true }));
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `${
          import.meta.env.VITE_API_URL
        }/api/v1/admin/approvals/approve-profile/${userId}`,
        null,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setPendingApprovals(
        pendingApprovals.filter((user) => user._id !== userId)
      );
      toast.success("Profile changes approved successfully!");
    } catch (error) {
      console.error("Error approving profile changes:", error);
      toast.error("Failed to approve profile changes.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleReject = async (userId) => {
    const reason = rejectionNotes[userId]?.trim();
    if (!reason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    try {
      setActionLoading((prev) => ({ ...prev, [userId]: true }));
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `${
          import.meta.env.VITE_API_URL
        }/api/v1/admin/approvals/reject-profile/${userId}`,
        { reason },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setPendingApprovals(
        pendingApprovals.filter((user) => user._id !== userId)
      );
      toast.success("Profile changes rejected successfully!");
      setRejectionNotes((prev) => ({ ...prev, [userId]: "" }));
    } catch (error) {
      console.error("Error rejecting profile changes:", error);
      toast.error("Failed to reject profile changes.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Filter approvals based on type
  const filteredApprovals = pendingApprovals.filter((user) => {
    if (filter === "all") return true;
    if (filter === "photos") return user.pendingChanges?.photos?.length > 0;
    if (filter === "profile") {
      return Object.keys(user.pendingChanges || {}).some(
        (key) => key !== "photos"
      );
    }
    return true;
  });

  // Helper: Determine if this is a new user (no photos, no profile fields set)
  const isNewUser = (user) => {
    return !user.photos?.length && !user.firstName && !user.lastName;
  };

  // Helper: Get user avatar (first photo or fallback)
  const getUserAvatar = (user) => {
    // Check current photos array first
    if (user.photos && user.photos.length > 0) {
      return getImageUrl(user.photos[0]); // Return first photo from array
    }
    // Check pending photos array
    if (user.pendingChanges?.photos && user.pendingChanges.photos.length > 0) {
      return getImageUrl(user.pendingChanges.photos[0]); // Return first pending photo
    }
    return null; // No photos available
  };

  // Helper: Format field name for display
  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Helper: Get field value for display
  const getFieldValue = (value) => {
    if (value === undefined || value === null || value === "") {
      return "(empty)";
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return value.toString();
  };

  // Helper: Toggle user expansion
  const toggleUserExpansion = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Pencil className="w-6 h-6 text-blue-500" />
          Profile Change Approvals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and approve user profile updates and photo changes
        </p>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg ${
            filter === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Changes
        </button>
        <button
          onClick={() => setFilter("photos")}
          className={`px-4 py-2 rounded-lg ${
            filter === "photos"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Photo Changes
        </button>
        <button
          onClick={() => setFilter("profile")}
          className={`px-4 py-2 rounded-lg ${
            filter === "profile"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Profile Changes
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner
            size="lg"
            color="blue"
            text="Loading pending approvals..."
          />
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <User className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            No pending approvals found
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredApprovals.map((user) => (
            <div
              key={user._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* User Info Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400 bg-gray-200 flex-shrink-0">
                    {getUserAvatar(user) ? (
                      <img
                        src={getUserAvatar(user)}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-400 mx-auto my-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {user.firstName} {user.lastName}
                      <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Profile Update
                      </span>
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleUserExpansion(user._id)}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    {expandedUsers[user._id] ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleApprove(user._id)}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                    disabled={actionLoading[user._id]}
                  >
                    {actionLoading[user._id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      setShowReject((prev) => ({
                        ...prev,
                        [user._id]: !prev[user._id],
                      }))
                    }
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                    disabled={actionLoading[user._id]}
                  >
                    {actionLoading[user._id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                </div>
              </div>

              {/* Expanded Content - Current vs Changed Data */}
              {expandedUsers[user._id] && (
                <div className="p-4">
                  {/* Rejection Note Input */}
                  {showReject[user._id] && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <textarea
                        value={rejectionNotes[user._id] || ""}
                        onChange={(e) =>
                          setRejectionNotes((prev) => ({
                            ...prev,
                            [user._id]: e.target.value,
                          }))
                        }
                        placeholder="Enter reason for rejection..."
                        className="w-full p-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows="3"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleReject(user._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          disabled={actionLoading[user._id]}
                        >
                          {actionLoading[user._id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Confirm Rejection"
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setShowReject((prev) => ({
                              ...prev,
                              [user._id]: false,
                            }))
                          }
                          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Photo Changes */}
                  {user.pendingChanges?.photos &&
                    user.pendingChanges.photos.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          Photo Changes ({
                            user.pendingChanges.photos.length
                          }{" "}
                          new)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Current Photos */}
                          <div>
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Current Photos ({user.photos?.length || 0})
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              {user.photos && user.photos.length > 0 ? (
                                user.photos.map((photoUrl, idx) => (
                                  <img
                                    key={idx}
                                    src={getImageUrl(photoUrl)}
                                    alt={`Current photo ${idx + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border border-gray-300"
                                  />
                                ))
                              ) : (
                                <span className="italic text-gray-400 col-span-3">
                                  No current photos
                                </span>
                              )}
                            </div>
                          </div>

                          {/* New Photos */}
                          <div>
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                              New Photos ({user.pendingChanges.photos.length})
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              {user.pendingChanges.photos.map(
                                (photoUrl, idx) => (
                                  <img
                                    key={idx}
                                    src={getImageUrl(photoUrl)}
                                    alt={`New photo ${idx + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border border-blue-300 cursor-pointer hover:shadow-lg transition"
                                    onClick={() => setEnlargePhoto(photoUrl)}
                                  />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Profile Field Changes */}
                  {Object.keys(user.pendingChanges || {}).some(
                    (key) => key !== "photos"
                  ) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Pencil className="w-5 h-5" />
                        Profile Field Changes
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(user.pendingChanges)
                          .filter(([key]) => key !== "photos")
                          .map(([key, newValue]) => (
                            <div
                              key={key}
                              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                            >
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                {formatFieldName(key)}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Current Value */}
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Current:
                                  </span>
                                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                    {getFieldValue(user[key])}
                                  </p>
                                </div>

                                {/* New Value */}
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    New:
                                  </span>
                                  <p className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                    {getFieldValue(newValue)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo Enlargement Modal */}
      {enlargePhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={enlargePhoto}
              alt="Enlarged photo"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setEnlargePhoto(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;
