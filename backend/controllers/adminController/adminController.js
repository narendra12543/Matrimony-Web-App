// Admin operations

import logger from "../../utils/logger.js";
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import nodemailer from "nodemailer";
let Report, Feedback;
try {
  Report = (await import("../models/Report.js")).default;
} catch (e) {
  Report = null;
}
try {
  Feedback = (await import("../models/Feedback.js")).default;
} catch (e) {
  Feedback = null;
}

// Manually trigger daily recommendations (admin only)

// Get scheduler status
export const getSchedulerStatus = async (req, res) => {
  try {
    res.json({
      message: "Daily recommendation scheduler is running",
      schedule: "Every day at 6:00 AM (IST)",
      cleanupSchedule: "Every Sunday at 2:00 AM (IST)",
      lastRun: new Date().toISOString(),
      status: "active",
    });
  } catch (error) {
    logger.error(`Error getting scheduler status: ${error.message}`);
    res.status(500).json({ error: "Failed to get scheduler status" });
  }
};

// Admin: Search users by query (name, email, etc.)
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }
    // Build a case-insensitive regex for partial match
    const regex = new RegExp(query, "i");
    // Search by firstName, lastName, email, phone, city, etc.
    const users = await User.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { city: regex },
        { state: regex },
        { country: regex },
      ],
    }).select("-password -verificationDocuments");
    res.json({ count: users.length, users });
  } catch (error) {
    logger.error(`Admin user search error: ${error.message}`);
    res.status(500).json({ error: "Failed to search users" });
  }
};

// --- Advanced Admin Features ---

export const getTotalUsersCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    logger.error(`Error fetching total users count: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch total users count" });
  }
};

export const getMaleUsersCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ gender: "Male" });
    res.json({ count });
  } catch (err) {
    logger.error(`Error fetching male users count: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch male users count" });
  }
};

export const getFemaleUsersCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ gender: "Female" });
    res.json({ count });
  } catch (err) {
    logger.error(`Error fetching female users count: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch female users count" });
  }
};

export const getPremiumUsersCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ "subscription.isActive": true });
    res.json({ count });
  } catch (err) {
    logger.error(`Error fetching premium users count: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch premium users count" });
  }
};

export const getRecentUsersList = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("firstName lastName email createdAt");
    res.json({ users });
  } catch (err) {
    logger.error(`Error fetching recent users list: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch recent users list" });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMale = await User.countDocuments({ gender: "Male" });
    const totalFemale = await User.countDocuments({ gender: "Female" });
    const totalPremium = await User.countDocuments({
      "subscription.isActive": true,
    });
    res.json({ totalUsers, totalMale, totalFemale, totalPremium });
  } catch (err) {
    logger.error(`Error fetching user stats: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
};

export const enableUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        isDisabledByAdmin: false, 
        adminNotes: "",
        accountStatus: "active"
      },
      { new: true }
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send enabled email
    await sendEnabledUserEmailInternal(updatedUser);

    res.json({ message: "User account enabled", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to enable user" });
  }
};

export const disableUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { note } = req.body; // Admin can include a reason
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        isDisabledByAdmin: true, 
        adminNotes: note || "Disabled by admin",
        accountStatus: "suspended"
      },
      { new: true }
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send disabled email
    await sendDisabledUserEmailInternal(updatedUser);

    res.json({ message: "User account disabled", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to disable user" });
  }
};

// Internal function for sending disabled email (used by disableUser)
const sendDisabledUserEmailInternal = async (user) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const html = `
      <div style="font-family: 'Montserrat', Arial, sans-serif; background: #f8fafc; padding: 40px;">
        <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #f59e42 100%); color: white; padding: 32px 24px; text-align: center;">
            <h2 style="margin-bottom: 10px;">Account Disabled</h2>
            <p style="font-size: 18px;">Hello ${user.firstName},</p>
          </div>
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; color: #dc2626; font-weight: 600; margin-bottom: 18px;">
              Your Matrimony account has been <span style="color: #ef4444;">disabled</span> by the admin.
            </p>
            <p style="color: #374151; margin-bottom: 18px;">
              This may be due to a violation of our policies or a report from another user.
              If you believe this is a mistake, please contact our support team.
            </p>
            <div style="margin: 24px 0;">
              <a href="mailto:support@matromatch.com" style="background: #ef4444; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Contact Support
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Regards,<br>
              MatroMatch Team
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"MatroMatch Admin" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Matrimony Account Has Been Disabled",
      html,
    });
  } catch (err) {
    logger.error(`Failed to send disabled email to ${user.email}: ${err.message}`);
  }
};

// Internal function for sending enabled email (used by enableUser)
const sendEnabledUserEmailInternal = async (user) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const html = `
      <div style="font-family: 'Montserrat', Arial, sans-serif; background: #f8fafc; padding: 40px;">
        <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #3b82f6 100%); color: white; padding: 32px 24px; text-align: center;">
            <h2 style="margin-bottom: 10px;">Account Enabled</h2>
            <p style="font-size: 18px;">Hello ${user.firstName},</p>
          </div>
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; color: #22c55e; font-weight: 600; margin-bottom: 18px;">
              Your Matrimony account has been <span style="color: #22c55e;">enabled</span> by the admin.
            </p>
            <p style="color: #374151; margin-bottom: 18px;">
              You can now log in and continue using our platform.
            </p>
            <div style="margin: 24px 0;">
              <a href="https://matromatch.com/login" style="background: #22c55e; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Login Now
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Regards,<br>
              MatroMatch Team
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"MatroMatch Admin" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Matrimony Account Has Been Enabled",
      html,
    });
  } catch (err) {
    logger.error(`Failed to send enabled email to ${user.email}: ${err.message}`);
  }
};

export const getDisabledUsers = async (req, res) => {
  try {
    const disabledUsers = await User.find({ isDisabledByAdmin: true }).select(
      "-password"
    );
    res.json(disabledUsers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch disabled users" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select("-password")
      .populate("subscription.plan")
      .lean(); // Use .lean() for plain JavaScript objects
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    logger.error(`Error fetching user ${req.params.userId}: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const getAllReports = async (req, res) => {
  if (!Report)
    return res.status(501).json({ error: "Report model not implemented" });
  try {
    const reports = await Report.find()
      .populate("reportedUser", "username email")
      .populate("reporter", "username email");
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

export const markReportReviewed = async (req, res) => {
  if (!Report)
    return res.status(501).json({ error: "Report model not implemented" });
  try {
    const { reportId } = req.params;
    await Report.findByIdAndUpdate(reportId, { reviewed: true });
    res.json({ message: "Report marked as reviewed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update report" });
  }
};

export const getFeedbackAnalytics = async (req, res) => {
  if (!Feedback)
    return res.status(501).json({ error: "Feedback model not implemented" });
  try {
    const feedbacks = await Feedback.find();
    const totalRatings = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const averageRating =
      feedbacks.length > 0 ? totalRatings / feedbacks.length : 0;
    res.json({ averageRating, totalFeedbacks: feedbacks.length, feedbacks });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback analytics" });
  }
};

export const getInactiveUsers = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - months);
    const inactiveUsers = await User.find({
      lastActive: { $lt: thresholdDate },
      isDisabled: false,
    }).select("-password");
    res.json(inactiveUsers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inactive users" });
  }
};

export const getNotifications = async (req, res) => {
  if (!Report)
    return res.status(501).json({ error: "Report model not implemented" });
  try {
    const newReports = await Report.find({ reviewed: false }).populate(
      "reportedUser",
      "username email"
    );
    res.json(newReports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Remove user permanently (not used for disable)
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users, exclude password and verificationDocuments
    const users = await User.find({}, "-password -verificationDocuments");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get admin notifications
export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.admin._id, // Use req.admin._id for admin authentication
      type: { $regex: /^admin_/ },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ error: "Failed to fetch admin notifications" });
  }
};

// Mark admin notification as read
export const markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        user: req.admin._id, // Use req.admin._id for admin authentication
        type: { $regex: /^admin_/ },
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking admin notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Delete admin notification
export const deleteAdminNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.admin._id, // Use req.admin._id for admin authentication
      type: { $regex: /^admin_/ },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// Clear all admin notifications
export const clearAllAdminNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user: req.admin._id, // Use req.admin._id for admin authentication
      type: { $regex: /^admin_/ },
    });

    res.status(200).json({
      message: "All notifications cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing all admin notifications:", error);
    res.status(500).json({ error: "Failed to clear all notifications" });
  }
};
