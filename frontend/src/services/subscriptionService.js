import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/subscription'; // Use Vite env variable

export const getPlans = async () => {
  const response = await axios.get(`${API_URL}/plans`);
  return response.data;
};

export const createOrder = async (planId) => {
  const response = await axios.post(`${API_URL}/payment/order`, { planId });
  return response.data;
};

export const verifyPayment = async (verificationData) => {
  const response = await axios.post(`${API_URL}/payment/verify`, verificationData);
  return response.data;
};