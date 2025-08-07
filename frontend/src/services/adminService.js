import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("No admin token found. Please log in.");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const adminGetMe = async () => {
  try {
    const res = await axios.get(`${API}api/v1/auth/admin/me`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    throw error;
  }
};

export const getUserStats = async () => {
  try {
    const res = await axios.get(`${API}/api/v1/admin/stats`, getAuthHeaders());
    return res.data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
};

export const getTotalUsers = async () => {
  try {
    const res = await axios.get(
      `${API}/api/v1/admin/stats/total-users`,
      getAuthHeaders()
    );
    return res.data.count;
  } catch (error) {
    console.error("Error fetching total users:", error);
    throw error;
  }
};

export const getMaleUsers = async () => {
  try {
    const res = await axios.get(
      `${API}/api/v1/admin/stats/male-users`,
      getAuthHeaders()
    );
    return res.data.count;
  } catch (error) {
    console.error("Error fetching male users:", error);
    throw error;
  }
};

export const getFemaleUsers = async () => {
  try {
    const res = await axios.get(
      `${API}/api/v1/admin/stats/female-users`,
      getAuthHeaders()
    );
    return res.data.count;
  } catch (error) {
    console.error("Error fetching female users:", error);
    throw error;
  }
};

export const getPremiumUsers = async () => {
  try {
    const res = await axios.get(
      `${API}/api/v1/admin/stats/premium-users`,
      getAuthHeaders()
    );
    return res.data.count;
  } catch (error) {
    console.error("Error fetching premium users:", error);
    throw error;
  }
};

export const getRecentUsers = async (limit = 5) => {
  try {
    const res = await axios.get(
      `${API}/api/v1/admin/users/recent?limit=${limit}`,
      getAuthHeaders()
    );
    return res.data.users;
  } catch (error) {
    console.error("Error fetching recent users:", error);
    throw error;
  }
};

export const searchUsersAdmin = async (query) => {
  try {
    const res = await axios.get(
      `${API}/api/v1/admin/search-users?query=${query}`,
      getAuthHeaders()
    );
    return res.data.users;
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const res = await axios.get(
      `${API}/api/v1/admin/users/${userId}`,
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

export const deleteUserByAdmin = async (userId) => {
  try {
    const res = await axios.delete(
      `${API}/api/v1/admin/users/${userId}`,
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

export const disableUser = async (userId, note = "") => {
  try {
    const res = await axios.put(
      `${API}/api/v1/admin/disable/${userId}`,
      { note },
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error(`Error disabling user ${userId}:`, error);
    throw error;
  }
};

export const enableUser = async (userId) => {
  try {
    const res = await axios.put(
      `${API}/api/v1/admin/enable/${userId}`,
      {},
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error(`Error enabling user ${userId}:`, error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const res = await axios.get(
      `${API}/api/v1/admin/users`,
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

// Add more admin API functions as needed, e.g.:
// export const getAllReports = async () => { ... }
// export const const markReportReviewed = async (reportId) => { ... }
// export const getFeedbackAnalytics = async () => { ... }
// export const getInactiveUsers = async () => { ... }
