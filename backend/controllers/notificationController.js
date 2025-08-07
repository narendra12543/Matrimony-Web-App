import Notification from '../models/Notification.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Get all notifications for the logged-in user
// Filters notifications based on user settings for Instant messages, New matches, and Reminders
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notificationSettings");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Apply filtering only for push settings
    notifications = notifications.filter((n) => {
      // Instant messages → controlled by instantMessages
      if (n.type === "message" && !user.notificationSettings.push.instantMessages) {
        return false;
      }

      // New matches → covers interest_sent/interest_accepted/profile_visit/new_request
      if (
        (n.type === "interest_sent" ||
         n.type === "interest_accepted" ||
         n.type === "profile_visit" ||
         n.type === "new_request") &&
        !user.notificationSettings.push.newMatches
      ) {
        return false;
      }

      // Reminders → controlled by reminders
      if (n.type === "reminder" && !user.notificationSettings.push.reminders) {
        return false;
      }

      // All other notification types (system, admin, etc.) always allowed
      return true;
    });

    res.status(200).json(notifications);
  } catch (error) {
    logger.error(`Error fetching notifications for user ${req.user._id}: ${error.message}`);
    res.status(500).json({ message: "Server error while fetching notifications" });
  }
};


export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    logger.error(`Error marking notification ${req.params.id} as read for user ${req.user._id}: ${error.message}`);
    res.status(500).json({ message: 'Server error while marking notification as read' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error(`Error marking all notifications as read for user ${req.user._id}: ${error.message}`);
    res.status(500).json({ message: 'Server error while marking all notifications as read' });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ message: 'All notifications cleared' });
  } catch (error) {
    logger.error(`Error clearing all notifications for user ${req.user._id}: ${error.message}`);
    res.status(500).json({ message: 'Server error while clearing notifications' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting notification ${req.params.id} for user ${req.user._id}: ${error.message}`);
    res.status(500).json({ message: 'Server error while deleting notification' });
  }
};

// Update notification settings for the user
// This allows users to enable/disable push notifications for instant messages, new matches, and reminders
export const updateNotificationSettings = async (req, res) => {
    try {
      const { push } = req.body;
      const userId = req.user.id;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "notificationSettings.push": push || {},
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      //  If reminders are enabled, add reminder notifications
      if (push?.reminders === true) {
        // Profile Incompletion Reminder
        if (!updatedUser.essentialProfileComplete) {
          await Notification.create({
            user: updatedUser._id,
            type: "reminder",
            title: "Complete Your Profile",
            message: "Add your photo and details to get better matches.",
            link: "/profile",
          });
        }

        // Trial/Subscription Expiry Reminder (expires in next 3 days)
        if (updatedUser.trial?.isActive && updatedUser.trial?.endDate) {
          const endDate = new Date(updatedUser.trial.endDate);
          const today = new Date();
          const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

          if (diffDays > 0 && diffDays <= 3) {
            await Notification.create({
              user: updatedUser._id,
              type: "reminder",
              title: "Trial Ending Soon",
              message:
                "Your trial expires in " +
                diffDays +
                " day(s). Upgrade now to continue enjoying premium features.",
              link: "/plans",
            });
          }
        }

        // Inactivity Reminder (if user inactive > 7 days)
        if (updatedUser.lastActive) {
          const lastActive = new Date(updatedUser.lastActive);
          const today = new Date();
          const diffDays = Math.ceil(
            (today - lastActive) / (1000 * 60 * 60 * 24)
          );

          if (diffDays >= 7) {
            await Notification.create({
              user: updatedUser._id,
              type: "reminder",
              title: "We miss you!",
              message: "Log in to see your new matches today.",
              link: "/dashboard",
            });
          }
        }
      }

      // If reminders are disabled, mark all existing reminders as read
      if (push?.reminders === false) {
        await Notification.updateMany(
          { user: updatedUser._id, type: "reminder", isRead: false },
          { isRead: true }
        );
      }

      res.json({
        message: "Notification settings updated successfully",
        notificationSettings: updatedUser.notificationSettings,
      });
    } catch (err) {
      console.error("Error saving notification settings:", err);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
};