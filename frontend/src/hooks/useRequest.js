import { useState } from 'react';
import { sendRequest as apiSendRequest } from '../services/requestService';
import { toast } from 'react-hot-toast';

export const useRequest = () => {
  const [loading, setLoading] = useState(false);

  const sendRequest = async (receiverId) => {
    setLoading(true);
    try {
      const response = await apiSendRequest(receiverId);
      toast.success(`${response.message} You have ${response.remainingRequests} requests left.`);
      return true;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to send request.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { sendRequest, loading };
};