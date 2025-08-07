import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { assignUniqueIdToUser } from "../services/idGeneratorService.js";
import { initializeIdCounter } from "../services/idGeneratorService.js";
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

const createTestUser = async () => {
  try {
    await connectDB();
    await initializeIdCounter();

    logger.info("🧪 Creating test user...");

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      logger.info("Test user already exists:", existingUser.email);

      // Assign unique ID if not already assigned
      if (!existingUser.uniqueId) {
        const uniqueId = await assignUniqueIdToUser(existingUser._id);
        logger.info(`✅ Assigned unique ID: ${uniqueId}`);
      } else {
        logger.info(`User already has unique ID: ${existingUser.uniqueId}`);
      }

      return;
    }

    // Create test user
    const testUser = new User({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "testpassword123",
      phone: "1234567890",
      gender: "Male",
      dateOfBirth: new Date("1990-01-01"),
      isEmailVerified: true,
      approvalStatus: "approved",
    });

    await testUser.save();
    logger.info("✅ Test user created:", testUser.email);

    // Assign unique ID
    const uniqueId = await assignUniqueIdToUser(testUser._id);
    logger.info(`✅ Assigned unique ID: ${uniqueId}`);

    // Verify the user was created with unique ID
    const updatedUser = await User.findById(testUser._id);
    logger.info(
      `Final user data: ${updatedUser.email} - ${updatedUser.uniqueId}`
    );

    logger.info("🎉 Test user creation completed!");
  } catch (error) {
    logger.error("Test user creation failed:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUser();
}

export default createTestUser;
