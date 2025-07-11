// Admin operations

import { triggerDailyRecommendations as triggerRecommendations } from "../services/schedulerService.js";
import logger from "../utils/logger.js";

// Manually trigger daily recommendations (admin only)
export const triggerDailyRecommendations = async (req, res) => {
  try {
    logger.info("Admin triggered daily recommendation generation");
    await triggerRecommendations();
    res.json({ 
      message: "Daily recommendations generation triggered successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error triggering daily recommendations: ${error.message}`);
    res.status(500).json({ 
      error: "Failed to trigger daily recommendations",
      details: error.message 
    });
  }
};

// Get scheduler status
export const getSchedulerStatus = async (req, res) => {
  try {
    res.json({
      message: "Daily recommendation scheduler is running",
      schedule: "Every day at 6:00 AM (IST)",
      cleanupSchedule: "Every Sunday at 2:00 AM (IST)",
      lastRun: new Date().toISOString(),
      status: "active"
    });
  } catch (error) {
    logger.error(`Error getting scheduler status: ${error.message}`);
    res.status(500).json({ error: "Failed to get scheduler status" });
  }
};
