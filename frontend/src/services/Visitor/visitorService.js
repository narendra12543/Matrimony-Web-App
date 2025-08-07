import axios from 'axios';
const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/visiter`;

export const addVisitor = async ({ visitedUserId, visitorUserId }) => {
  console.log("Attempting to add visitor:", { visitedUserId, visitorUserId });
  const response = await axios.post(API_URL, { visitedUserId, visitorUserId });
  return response.data;
};

export const getVisitors = async (visitedUserId) => {
  const response = await axios.get(`${API_URL}?visitedUserId=${visitedUserId}`);
  return response.data;
}; 