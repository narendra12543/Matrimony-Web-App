import Notification from "../models/Notification.js";
import { getIO } from "../utils/socket.js";

export const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();

    // Push notification to the user via WebSocket
    try {
      const io = getIO();
      if (io) {
        io.to(notificationData.user.toString()).emit(
          "new-notification",
          notification
        );
      } else {
        console.warn(
          "WebSocket not available, notification saved to database only"
        );
      }
    } catch (socketError) {
      console.error("Error sending notification via WebSocket:", socketError);
      // Don't fail the entire notification if WebSocket fails
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error; // Re-throw the error so calling function knows it failed
  }
};
