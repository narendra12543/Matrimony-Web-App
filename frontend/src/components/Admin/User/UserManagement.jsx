import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  disableUser,
  enableUser,
} from "../../../services/adminService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  User,
  Mail,
  Shield,
  Crown,
  Loader,
  Search,
  XCircle,
} from "lucide-react";
import { getImageUrl } from "../../../utils/imageUtils";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res.users || []);
    } catch (err) {
      setUsers([]);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  // Show modal instead of browser confirm
  const openDisableModal = (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowModal(true);
  };

  const openEnableModal = (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowEnableModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowEnableModal(false);
    setSelectedUserId(null);
    setSelectedUserName("");
  };

  const handleDisable = async () => {
    if (!selectedUserId) return;
    toast.loading("Disabling user...");
    try {
      await disableUser(selectedUserId);
      toast.dismiss();
      toast.success("User disabled and notified");
      fetchUsers();
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to disable user");
    } finally {
      closeModal();
    }
  };

  const handleEnable = async () => {
    if (!selectedUserId) return;
    toast.loading("Enabling user...");
    try {
      await enableUser(selectedUserId);
      toast.dismiss();
      toast.success("User enabled and notified");
      fetchUsers();
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to enable user");
    } finally {
      closeModal();
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            View, search, and manage all users on the platform
          </p>
        </div>
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email"
            className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full bg-white shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Disable Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
              aria-label="Close"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center">
              <Shield className="w-12 h-12 text-red-500 mb-2" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Disable User
              </h2>
              <p className="text-gray-700 mb-4 text-center">
                Are you sure you want to{" "}
                <span className="text-red-500 font-semibold">disable</span>{" "}
                <br />
                <span className="font-semibold">{selectedUserName}</span>'s
                account?
              </p>
              <div className="flex gap-4 mt-2">
                <button
                  className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition"
                  onClick={handleDisable}
                >
                  Yes, Disable
                </button>
                <button
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enable Confirmation Modal */}
      {showEnableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
              aria-label="Close"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center">
              <Shield className="w-12 h-12 text-green-500 mb-2" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Enable User
              </h2>
              <p className="text-gray-700 mb-4 text-center">
                Are you sure you want to{" "}
                <span className="text-green-500 font-semibold">enable</span> <br />
                <span className="font-semibold">{selectedUserName}</span>'s
                account?
              </p>
              <div className="flex gap-4 mt-2">
                <button
                  className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition"
                  onClick={handleEnable}
                >
                  Yes, Enable
                </button>
                <button
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <span className="text-gray-500 font-medium">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <User className="w-16 h-16 text-gray-300 mb-4" />
            <span className="text-gray-500 font-medium">
              No users found matching your search.
            </span>
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-indigo-50">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-700">
                  Name
                </th>
                <th className="p-4 text-left font-semibold text-gray-700">
                  Email
                </th>
                <th className="p-4 text-left font-semibold text-gray-700">
                  Gender
                </th>
                <th className="p-4 text-left font-semibold text-gray-700">
                  Premium
                </th>
                <th className="p-4 text-left font-semibold text-gray-700">
                  Last Active
                </th>
                <th className="p-4 text-left font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b hover:bg-indigo-50/30 transition"
                >
                  {/* Name */}
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      {user.photos?.[0] ? (
                        <img
                          src={getImageUrl(user.photos[0])}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                  </td>
                  {/* Gender */}
                  <td className="p-4 align-middle">{user.gender}</td>
                  {/* Premium */}
                  <td className="p-4 align-middle">
                    {user.subscription?.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        <Crown className="w-4 h-4" /> Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                        Free
                      </span>
                    )}
                  </td>
                  {/* Last Active */}
                  <td className="p-4 align-middle">
                    {user.lastActive
                      ? new Date(user.lastActive).toLocaleDateString()
                      : "N/A"}
                  </td>
                  {/* Actions */}
                  <td className="p-4 align-middle">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                        onClick={() => handleView(user._id)}
                      >
                        View
                      </button>
                      {user.accountStatus === "suspended" ? (
                        <button
                          className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition"
                          onClick={() =>
                            openEnableModal(
                              user._id,
                              `${user.firstName} ${user.lastName}`
                            )
                          }
                        >
                          Enable
                        </button>
                      ) : (
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
                          onClick={() =>
                            openDisableModal(
                              user._id,
                              `${user.firstName} ${user.lastName}`
                            )
                          }
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
