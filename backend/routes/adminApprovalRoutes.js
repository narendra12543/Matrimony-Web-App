import express from "express";
import {
  getPendingApprovals,
  getNewUsers,
  getProfileChanges,
  approveProfileChanges,
  rejectProfileChanges,
  approveNewUser,
  rejectNewUser,
} from "../controllers/adminController/adminApprovalController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = express.Router();

// Get all users with pending profile changes (legacy endpoint)
router.get(
  "/pending-approvals",
  authenticate,
  requireAdmin,
  getPendingApprovals
);

// Get new users (separate endpoint)
router.get("/new-users", authenticate, requireAdmin, getNewUsers);

// Get profile changes (separate endpoint)
router.get("/profile-changes", authenticate, requireAdmin, getProfileChanges);

// Approve a user's profile changes
router.put(
  "/approve-profile/:userId",
  authenticate,
  requireAdmin,
  approveProfileChanges
);

// Reject a user's profile changes
router.put(
  "/reject-profile/:userId",
  authenticate,
  requireAdmin,
  rejectProfileChanges
);

// Approve a new user
router.put(
  "/approve-new-user/:userId",
  authenticate,
  requireAdmin,
  approveNewUser
);

// Reject a new user
router.put(
  "/reject-new-user/:userId",
  authenticate,
  requireAdmin,
  rejectNewUser
);

export default router;
