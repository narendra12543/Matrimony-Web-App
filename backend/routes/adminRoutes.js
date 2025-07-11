// Admin routes
import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { 
  triggerDailyRecommendations, 
  getSchedulerStatus 
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// Daily recommendation scheduler routes (admin only)
adminRouter.post(
  "/trigger-daily-recommendations",
  authenticate,
  requireAdmin,
  triggerDailyRecommendations
);

adminRouter.get(
  "/scheduler-status",
  authenticate,
  requireAdmin,
  getSchedulerStatus
);

export default adminRouter;
