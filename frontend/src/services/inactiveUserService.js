import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/admin/inactive-users`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Fetch inactive users with optional filters
export const fetchInactiveUsers = (days = 10, firstName = "", lastName = "") => {
  const params = new URLSearchParams({ days, firstName, lastName });
  return axios.get(`${API_URL}/inactive?${params.toString()}`, getAuthHeaders());
};

// Send follow-up email
export const sendFollowUpEmail = (userId) => {
  return axios.post(`${API_URL}/send-email/${userId}`, {}, getAuthHeaders());
};

// Mark user for cleanup (delete)
export const markForCleanup = (userId) => {
  return axios.post(`${API_URL}/action/${userId}`, { action: "cleanup" }, getAuthHeaders());
};

// Get stats (10, 15, 30+ inactive)
export const fetchInactiveStats = () => {
  return axios.get(`${API_URL}/inactive-stats`, getAuthHeaders());
};
