import React, { useState, useEffect } from "react";
import { Calendar, Download, RefreshCw, Search } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  fetchInactiveUsers,
  sendFollowUpEmail,
  markForCleanup,
  fetchInactiveStats,
} from "../../../services/inactiveUserService"; // importing service functions

export default function InactiveUser() { // Main component for managing inactive users
  // State variables for managing users, actions, filters, and stats
  const [users, setUsers] = useState([]);
  const [actions, setActions] = useState({});
  const [days, setDays] = useState("10");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ ten: 0, fifteen: 0, thirty: 0 });

  const loadUsers = async () => { // Function to load inactive users based on filters
    try {
      const [firstName, lastName = ""] = searchTerm.trim().split(" ");
      const res = await fetchInactiveUsers(days, firstName, lastName);
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to fetch users.");
    }
  };

  const loadStats = async () => { // Function to load inactive user statistics
    try {
      const res = await fetchInactiveStats();
      setStats({
        ten: res.data.week || 0,
        fifteen: res.data.fortnight || 0,
        thirty: res.data.month || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => { // Initial load of users and stats when component mounts
    loadUsers();
    loadStats();
  }, [days, searchTerm]);

  const handleSelectChange = (id, value) => { // Function to handle action selection for each user
    setActions((prev) => ({ ...prev, [id]: value }));
    if (value === "follow-up") {
      toast.info("Follow-up recorded.");
    } else if (value === "cleanup") {
      const name = users.find((u) => u._id === id)?.firstName;
      toast.info(`Cleanup selected. Click 🗑️ to delete ${name}'s data.`);
    }
  };

  const handleSendFollowUpEmail = async (id) => { // Function to send follow-up email to a user
    try {
      await sendFollowUpEmail(id);
      toast.success("🖂 Follow-up email sent!");
    } catch {
      toast.error("Failed to send email.");
    }
  };

  const handleMarkForCleanup = async (id) => { // Function to mark a user for cleanup (delete)
    try {
      await markForCleanup(id);
      toast.success("User deleted successfully.");
      setUsers((prev) => prev.filter((u) => u._id !== id));
      loadStats();
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const handleExport = () => { // Function to export inactive users data as CSV
    const csv = [
      ["First Name", "Last Name", "Email", "Last Active", "Action"],
      ...users.map((u) => [
        u.firstName,
        u.lastName,
        u.email,
        new Date(u.lastActive).toLocaleDateString("en-GB"),
        actions[u._id] || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inactive_users_${days}_days.csv`;
    link.click();
  };

  const handleRefresh = () => { // Function to refresh the user list and stats
    setIsRefreshing(true);
    Promise.all([loadUsers(), loadStats()]).finally(() => setIsRefreshing(false));
  };

  const statCards = [
    { label: "10+ Days", color: "yellow", count: stats.ten },
    { label: "15+ Days", color: "orange", count: stats.fifteen },
    { label: "30+ Days", color: "red", count: stats.thirty },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto bg-blue-50 min-h-screen rounded-3xl shadow-lg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inactive User Management</h2>
          <p className="text-gray-600">Monitor and manage users who haven't been active recently</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-black hover:bg-indigo-200 rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div className={`p-3 bg-${card.color}-100 rounded-lg`}>
                <Calendar className={`w-6 h-6 text-${card.color}-600`} />
              </div>
              <span className={`text-sm text-${card.color}-600 font-medium`}>{card.label}</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mt-4">{card.count}</h3>
            <p className="text-sm text-gray-600 mt-1">Inactive for {card.label.toLowerCase()}</p>
          </div>
        ))}
      </div>

      {/* Days Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
        <div className="flex-1 w-full md:w-1/2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <label className="font-medium text-gray-700">Show users inactive for more than:</label>
        <select
          onChange={(e) => setDays(e.target.value)}
          value={days}
          className="px-4 py-2 border rounded-md text-sm bg-white shadow-sm"
        >
          <option value="10">10 days</option>
          <option value="15">15 days</option>
          <option value="30">30 days</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl bg-green-50 shadow">
        <table className="w-full text-sm min-w-[900px] text-center">
          <thead className="bg-blue-100">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Last Active</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
              <th className="p-4">Notify</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => {
                const inactive = new Date(u.lastActive) < new Date(Date.now() - days * 86400000);
                return (
                  <tr key={u._id} className="border-b">
                    <td className="p-4 font-medium text-gray-800">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="p-4 text-gray-700">{u.email}</td>
                    <td className="p-4 font-semibold text-gray-800">
                      {new Date(u.lastActive).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${
                          inactive ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {inactive ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        className="px-3 py-1 border rounded-md text-sm"
                        value={actions[u._id] || ""}
                        onChange={(e) => handleSelectChange(u._id, e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="follow-up">Follow-up</option>
                        <option value="cleanup">Cleanup</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {actions[u._id] === "follow-up" && (
                        <button
                          onClick={() => handleSendFollowUpEmail(u._id)}
                          className="text-blue-600 hover:text-blue-800 text-xl"
                        >
                          🖂
                        </button>
                      )}
                      {actions[u._id] === "cleanup" && (
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this user?")) {
                              handleMarkForCleanup(u._id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-xl"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </div>
  );
}
