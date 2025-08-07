import axios from 'axios';
const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/requests`;

export const sendRequest = async (receiverId, message = '') => {
  const response = await axios.post(`${API_URL}/send`, { receiverId, message });
  return response.data;
};

export const getUserRequests = async () => {
  const response = await axios.get(`${API_URL}/my-requests`);
  return response.data;
};

export const respondToRequest = async (requestId, action) => {
  const response = await axios.put(`${API_URL}/respond/${requestId}`, { action });
  return response.data;
};

export const cancelRequest = async (requestId) => {
  const response = await axios.delete(`${API_URL}/${requestId}`);
  return response.data;
}; 