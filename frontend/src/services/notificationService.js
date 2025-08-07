import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

const getNotifications = async () => {
  const response = await axios.get(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};

const markAsRead = async (id) => {
  const response = await axios.patch(
    `${API_URL}/notifications/${id}/read`,
    null,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }
  );
  return response.data;
};

const markAllAsRead = async () => {
  const response = await axios.patch(
    `${API_URL}/notifications/read-all`,
    null,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }
  );
  return response.data;
};

const clearAllNotifications = async () => {
  const response = await axios.delete(`${API_URL}/notifications/clear-all`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};

const deleteNotification = async (id) => {
  const response = await axios.delete(`${API_URL}/notifications/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};
class NotificationService {
  constructor() {
    this.permission = Notification.permission;
    this.isSupported = "Notification" in window;
  }

  async requestPermission() {
    if (!this.isSupported) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    if (this.permission !== "denied") {
      try {
        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === "granted";
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        return false;
      }
    }

    return false;
  }

  showNotification({ title, body, icon, tag, data, onClick }) {
    if (!this.isSupported || this.permission !== "granted") {
      return null;
    }

    const notification = new Notification(title, {
      body,
      icon: icon || undefined,
      tag: tag || "chat-notification",
      requireInteraction: false,
      data: data || {},
    });

    setTimeout(() => {
      notification.close();
    }, 5000);

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();
      if (onClick) {
        onClick(data);
      }
    };

    return notification;
  }
}

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
};
export default new NotificationService();
