import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  assignUniqueIdToUser,
  generateUniqueId,
} from "../services/idGeneratorService.js";
import { initializeIdCounter } from "../services/idGeneratorService.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const simpleTest = async () => {
  try {
    await connectDB();
    await initializeIdCounter();

    logger.info("🧪 Running simple test...");

    // Test 1: Generate unique ID
    logger.info("Testing unique ID generation...");
    const uniqueId = await generateUniqueId();
    logger.info(`✅ Generated unique ID: ${uniqueId}`);

    // Test 2: Get a user and assign unique ID
    const user = await User.findOne();
    if (user) {
      logger.info(`Found user: ${user.email}`);
      const assignedId = await assignUniqueIdToUser(user._id);
      logger.info(`✅ Assigned unique ID: ${assignedId}`);
    } else {
      logger.info("No users found in database");
    }

    // Test 3: Check all users with unique IDs
    const usersWithIds = await User.find({ uniqueId: { $exists: true } });
    logger.info(`Users with unique IDs: ${usersWithIds.length}`);

    usersWithIds.forEach((user) => {
      logger.info(`- ${user.email}: ${user.uniqueId}`);
    });

    logger.info("🎉 Simple test completed!");
  } catch (error) {
    logger.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleTest();
}

export default simpleTest;
