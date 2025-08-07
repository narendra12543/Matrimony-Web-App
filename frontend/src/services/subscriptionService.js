import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/api/v1/subscription'; // Use Vite env variable

export const getPlans = async () => {
  const response = await axios.get(`${API_URL}/plans`);
  return response.data;
};

// Always send both planId and amount
export const createOrder = async (planId, amount) => {
  // Defensive: amount must be a number
  const response = await axios.post(`${API_URL}/payment/order`, { planId, amount: Number(amount) });
  return response.data;
};

export const verifyPayment = async (verificationData) => {
  const response = await axios.post(`${API_URL}/payment/verify`, verificationData);
  return response.data;
};