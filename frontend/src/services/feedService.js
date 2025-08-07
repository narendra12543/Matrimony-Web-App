// Assuming you have an axios instance configured
import axios from "axios";
export const getMatchedUsers = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/v1/feed/matched-users`
    );
    // console.log(response.data.profiles);

    return response.data;
  } catch (error) {
    console.error("Error fetching matched users:", error);
    throw error;
  }
};
