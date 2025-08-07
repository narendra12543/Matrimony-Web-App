import React, { useState, useEffect } from "react";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getPendingApprovals,
  approveProfileChanges,
  rejectProfileChanges,
  approveNewUser,
  rejectNewUser,
  getNewUsers,
  getProfileChanges,
  getUserStats,
  getTotalUsersCount,
  getMaleUsersCount,
  getFemaleUsersCount,
  getPremiumUsersCount,
  getRecentUsersList,
  getAllReports,
  disableUser,
  enableUser,
  getDisabledUsers,
  markReportReviewed,
  getFeedbackAnalytics,
  getInactiveUsers,
  deleteUserByAdmin,
  sendDisabledUserEmail,
  getAdminNotifications,
  markAdminNotificationAsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
} from "../controllers/adminController/adminController.js";
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Daily recommendation scheduler routes (admin only)
router.get(
  "/stats/total-users",
  authenticate,
  requireAdmin,
  getTotalUsersCount
);
router.get(
  "/stats/male-users",
  authenticate,
  requireAdmin,
  getMaleUsersCount
);
router.get(
  "/stats/female-users",
  authenticate,
  requireAdmin,
  getFemaleUsersCount
);
router.get(
  "/stats/premium-users",
  authenticate,
  requireAdmin,
  getPremiumUsersCount
);
router.get(
  "/users/recent",
  authenticate,
  requireAdmin,
  getRecentUsersList
);

router.get(
  "/scheduler-status",
  authenticate,
  requireAdmin,
  getSchedulerStatus
);

// Admin: Search users by query (name, email, etc.)
router.get("/search-users", authenticate, requireAdmin, searchUsers);

// --- Advanced Admin Features ---

router.get("/stats", authenticate, requireAdmin, getUserStats);
router.get("/reports", authenticate, requireAdmin, getAllReports);
router.put("/disable/:userId", authenticate, requireAdmin, disableUser);
router.put("/enable/:userId", authenticate, requireAdmin, enableUser);
router.get(
  "/disabled-users",
  authenticate,
  requireAdmin,
  getDisabledUsers
);
router.get("/users/:userId", authenticate, requireAdmin, getUserById);
router.put(
  "/notifications/:reportId/reviewed",
  authenticate,
  requireAdmin,
  markReportReviewed
);
router.get(
  "/analytics/feedback",
  authenticate,
  requireAdmin,
  getFeedbackAnalytics
);
router.get(
  "/inactive-users",
  authenticate,
  requireAdmin,
  getInactiveUsers
);
router.delete(
  "/users/:userId",
  authenticate,
  requireAdmin,
  deleteUserByAdmin
);
router.post(
  "/users/:userId/send-disabled-email",
  authenticate,
  requireAdmin,
  sendDisabledUserEmail
);
router.get("/users", authenticate, requireAdmin, getAllUsers); // <-- Add this route

// Admin notification routes
router.get(
  "/notifications",
  authenticate,
  requireAdmin,
  getAdminNotifications
);

router.delete(
  "/notifications/clear-all",
  authenticate,
  requireAdmin,
  clearAllAdminNotifications
);

router.patch(
  "/notifications/:id/read",
  authenticate,
  requireAdmin,
  markAdminNotificationAsRead
);

router.delete(
  "/notifications/:id",
  authenticate,
  requireAdmin,
  deleteAdminNotification
);

// Admin subscription routes
router.get("/plans", getPlans);
router.post("/payment/order", authenticate, requireUser, paymentLimiter, createOrder);
router.post("/payment/verify", authenticate, requireUser, paymentLimiter, verifyPayment);
// Add to your subscription routes
router.post('/free-upgrade', authenticate,requireUser, freeUpgrade);

export default router;