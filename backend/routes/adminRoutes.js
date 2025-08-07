// Admin routes
import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  getSchedulerStatus,
  searchUsers,
  getUserStats,
  getTotalUsersCount,
  getMaleUsersCount,
  getFemaleUsersCount,
  getPremiumUsersCount,
  getRecentUsersList,
  // Uncomment these if you have the models and implementations:
  getAllReports,
  disableUser,
  enableUser,
  getDisabledUsers,
  getUserById,
  markReportReviewed,
  getFeedbackAnalytics,
  getInactiveUsers,
  deleteUserByAdmin,
  getAllUsers, // <-- Add this import
  getAdminNotifications,
  markAdminNotificationAsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
} from "../controllers/adminController/adminController.js";
import {
  getAllUsersWithSubscriptions,
  updateUserSubscriptionByAdmin,
  deleteUserSubscriptionByAdmin,
  createPlanByAdmin,
  updatePlanByAdmin,
  deletePlanByAdmin,
  getAllPlansForAdmin,
} from "../controllers/adminController/adminSubscriptionController.js";

const adminRouter = express.Router();

// Daily recommendation scheduler routes (admin only)
adminRouter.get(
  "/stats/total-users",
  authenticate,
  requireAdmin,
  getTotalUsersCount
);
adminRouter.get(
  "/stats/male-users",
  authenticate,
  requireAdmin,
  getMaleUsersCount
);
adminRouter.get(
  "/stats/female-users",
  authenticate,
  requireAdmin,
  getFemaleUsersCount
);
adminRouter.get(
  "/stats/premium-users",
  authenticate,
  requireAdmin,
  getPremiumUsersCount
);
adminRouter.get(
  "/users/recent",
  authenticate,
  requireAdmin,
  getRecentUsersList
);

adminRouter.get(
  "/scheduler-status",
  authenticate,
  requireAdmin,
  getSchedulerStatus
);

adminRouter.get("/search-users", authenticate, requireAdmin, searchUsers);

// Advanced admin endpoints
adminRouter.get("/stats", authenticate, requireAdmin, getUserStats);
// Uncomment and implement these if you have the models and controller functions:
adminRouter.get("/reports", authenticate, requireAdmin, getAllReports);
adminRouter.put("/disable/:userId", authenticate, requireAdmin, disableUser);
adminRouter.put("/enable/:userId", authenticate, requireAdmin, enableUser);
adminRouter.get(
  "/disabled-users",
  authenticate,
  requireAdmin,
  getDisabledUsers
);
adminRouter.get("/users/:userId", authenticate, requireAdmin, getUserById);
adminRouter.put(
  "/notifications/:reportId/reviewed",
  authenticate,
  requireAdmin,
  markReportReviewed
);
adminRouter.get(
  "/analytics/feedback",
  authenticate,
  requireAdmin,
  getFeedbackAnalytics
);
adminRouter.get(
  "/inactive-users",
  authenticate,
  requireAdmin,
  getInactiveUsers
);
adminRouter.delete(
  "/users/:userId",
  authenticate,
  requireAdmin,
  deleteUserByAdmin
);
// Remove this endpoint (handled in disableUser now):
// adminRouter.post(
//   "/users/:userId/send-disabled-email",
//   authenticate,
//   requireAdmin,
//   sendDisabledUserEmail
// );
adminRouter.get("/users", authenticate, requireAdmin, getAllUsers); // <-- Add this route

// Subscription management routes (admin)
adminRouter.get(
  "/subscriptions/users",
  authenticate,
  requireAdmin,
  getAllUsersWithSubscriptions
);
adminRouter.put(
  "/subscriptions/user/:userId",
  authenticate,
  requireAdmin,
  updateUserSubscriptionByAdmin
);
adminRouter.delete(
  "/subscriptions/user/:userId",
  authenticate,
  requireAdmin,
  deleteUserSubscriptionByAdmin
);

// Plan CRUD for admin
adminRouter.get(
  "/subscriptions/plans",
  authenticate,
  requireAdmin,
  getAllPlansForAdmin
);
adminRouter.post(
  "/subscriptions/plans",
  authenticate,
  requireAdmin,
  createPlanByAdmin
);
adminRouter.put(
  "/subscriptions/plans/:planId",
  authenticate,
  requireAdmin,
  updatePlanByAdmin
);
adminRouter.delete(
  "/subscriptions/plans/:planId",
  authenticate,
  requireAdmin,
  deletePlanByAdmin
);

// Admin notification routes
adminRouter.get(
  "/notifications",
  authenticate,
  requireAdmin,
  getAdminNotifications
);

adminRouter.delete(
  "/notifications/clear-all",
  authenticate,
  requireAdmin,
  clearAllAdminNotifications
);

adminRouter.patch(
  "/notifications/:id/read",
  authenticate,
  requireAdmin,
  markAdminNotificationAsRead
);

adminRouter.delete(
  "/notifications/:id",
  authenticate,
  requireAdmin,
  deleteAdminNotification
);

export default adminRouter;
