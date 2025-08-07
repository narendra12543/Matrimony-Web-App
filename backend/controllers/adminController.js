// Admin operations

import logger from "../utils/logger.js";
import User from "../models/User.js";
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
    const totalPremium = await User.countDocuments({ "subscription.isActive": true });
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
      { isDisabledByAdmin: false, adminNotes: "" },
      { new: true }
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
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
      { isDisabledByAdmin: true, adminNotes: note || "Disabled by admin" },
      { new: true }
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User account disabled", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to disable user" });
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
