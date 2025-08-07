import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Loader2,
  User,
  CheckCircle,
  XCircle,
  UserPlus,
  Eye,
  EyeOff,
  Clock,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import LoadingSpinner from "../../LoadingSpinner";

const NewUserApproval = () => {
  const [newUsers, setNewUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [showReject, setShowReject] = useState({});
  const [expandedUsers, setExpandedUsers] = useState({});

  useEffect(() => {
    const fetchNewUsers = async () => {
      try {
        setLoading(true);
        const adminToken = localStorage.getItem("adminToken");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/admin/approvals/new-users`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
        setNewUsers(response.data);
      } catch (error) {
        console.error("Error fetching new users:", error);
        toast.error("Failed to fetch new users.");
      } finally {
        setLoading(false);
      }
    };

    fetchNewUsers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [userId]: true }));
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/approvals/approve-new-user/${userId}`,
        null,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setNewUsers(newUsers.filter((user) => user._id !== userId));
      toast.success("New user approved successfully!");
    } catch (error) {
      console.error("Error approving new user:", error);
      toast.error("Failed to approve new user.");
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
        `${import.meta.env.VITE_API_URL}/api/v1/admin/approvals/reject-new-user/${userId}`,
        { reason },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setNewUsers(newUsers.filter((user) => user._id !== userId));
      toast.success("New user rejected successfully!");
      setRejectionNotes((prev) => ({ ...prev, [userId]: "" }));
    } catch (error) {
      console.error("Error rejecting new user:", error);
      toast.error("Failed to reject new user.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const toggleUserExpansion = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "Not provided";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-green-500" />
          New User Approvals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and approve new user registrations
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner
            size="lg"
            color="blue"
            text="Loading new users..."
          />
        </div>
      ) : newUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <UserPlus className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            No new users pending approval
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {newUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* User Info Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-400 bg-gray-200 flex-shrink-0">
                    <User className="w-10 h-10 text-gray-400 mx-auto my-1" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {user.firstName} {user.lastName}
                      <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 flex items-center gap-1">
                        <UserPlus className="w-3 h-3" /> New User
                      </span>
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Registered: {formatDate(user.createdAt)}
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

              {/* Expanded Content - User Details */}
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

                  {/* User Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Basic Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="text-sm font-medium">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="text-sm font-medium">{user.phone || "Not provided"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Date of Birth:</span>
                          <span className="text-sm font-medium">
                            {user.dateOfBirth ? `${formatDate(user.dateOfBirth)} (${calculateAge(user.dateOfBirth)} years)` : "Not provided"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Gender:</span>
                          <span className="text-sm font-medium">{user.gender || "Not provided"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Registration Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Registration Date:</span>
                          <span className="text-sm font-medium">{formatDate(user.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Email Verified:</span>
                          <span className={`text-sm font-medium ${user.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                            {user.isEmailVerified ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Account Status:</span>
                          <span className="text-sm font-medium text-yellow-600">Pending Approval</span>
                        </div>
                      </div>
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

export default NewUserApproval; 