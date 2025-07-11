import cron from "node-cron";
import { getDailyRecommendations } from "./matchService.js";
import DailyRecommendation from "../models/DailyRecommendation.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// Function to generate daily recommendations for all active users
const generateDailyRecommendations = async () => {
  try {
    logger.info("Starting daily recommendation generation...");
    
    // Get all active users
    const activeUsers = await User.find({ 
      accountStatus: "active",
      isVerified: true 
    }).select("_id");
    
    logger.info(`Found ${activeUsers.length} active users for daily recommendations`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Generate recommendations for each user
    for (const user of activeUsers) {
      try {
        // Check if recommendation already exists for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingRecommendation = await DailyRecommendation.findOne({
          userId: user._id,
          date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        });
        
        if (existingRecommendation) {
          logger.info(`Daily recommendation already exists for user ${user._id}`);
          continue;
        }
        
        // Get recommendation for this user
        const recommendations = await getDailyRecommendations(user._id, 1);
        
        if (recommendations.length > 0) {
          const recommendation = recommendations[0];
          
          // Calculate match percentage
          const matchPercentage = Math.min(100, Math.round((recommendation.matchScore / 10) * 100));
          
          // Save the daily recommendation
          await DailyRecommendation.create({
            userId: user._id,
            recommendedUserId: recommendation._id,
            matchScore: recommendation.matchScore,
            matchPercentage: matchPercentage,
            date: new Date()
          });
          
          successCount++;
          logger.info(`Generated daily recommendation for user ${user._id}`);
        } else {
          logger.warn(`No recommendations found for user ${user._id}`);
        }
      } catch (error) {
        errorCount++;
        logger.error(`Error generating recommendation for user ${user._id}: ${error.message}`);
      }
    }
    
    logger.info(`Daily recommendation generation completed. Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    logger.error(`Error in daily recommendation generation: ${error.message}`);
  }
};

// Function to clean old recommendations (older than 30 days)
const cleanOldRecommendations = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await DailyRecommendation.deleteMany({
      date: { $lt: thirtyDaysAgo }
    });
    
    logger.info(`Cleaned ${result.deletedCount} old daily recommendations`);
  } catch (error) {
    logger.error(`Error cleaning old recommendations: ${error.message}`);
  }
};

// Initialize scheduler
export const initializeScheduler = () => {
  logger.info("Initializing daily recommendation scheduler...");
  
  // Schedule daily recommendation generation at 6:00 AM every day
  cron.schedule("0 6 * * *", async () => {
    logger.info("Running scheduled daily recommendation generation...");
    await generateDailyRecommendations();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  // Schedule cleanup of old recommendations at 2:00 AM every Sunday
  cron.schedule("0 2 * * 0", async () => {
    logger.info("Running scheduled cleanup of old recommendations...");
    await cleanOldRecommendations();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  logger.info("Daily recommendation scheduler initialized successfully");
};

// Manual trigger function for testing
export const triggerDailyRecommendations = async () => {
  logger.info("Manually triggering daily recommendation generation...");
  await generateDailyRecommendations();
};

// Get today's recommendation for a user
export const getTodayRecommendation = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recommendation = await DailyRecommendation.findOne({
      userId: userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate("recommendedUserId");
    
    return recommendation;
  } catch (error) {
    logger.error(`Error getting today's recommendation for user ${userId}: ${error.message}`);
    throw error;
  }
}; 