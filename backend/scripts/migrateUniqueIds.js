import mongoose from "mongoose";
import dotenv from "dotenv";
import { assignUniqueIdToUser } from "../services/idGeneratorService.js";
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

const migrateUniqueIds = async () => {
  try {
    await connectDB();
    await initializeIdCounter();

    logger.info("Starting unique ID migration...");

    // Find all users without unique IDs
    const usersWithoutUniqueId = await User.find({
      uniqueId: { $exists: false },
    });

    logger.info(
      `Found ${usersWithoutUniqueId.length} users without unique IDs`
    );

    if (usersWithoutUniqueId.length === 0) {
      logger.info("All users already have unique IDs. Migration complete!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutUniqueId) {
      try {
        await assignUniqueIdToUser(user._id);
        successCount++;
        logger.info(`Assigned unique ID to user: ${user.email}`);
      } catch (error) {
        errorCount++;
        logger.error(
          `Failed to assign unique ID to user ${user.email}:`,
          error.message
        );
      }
    }

    logger.info(
      `Migration complete! Success: ${successCount}, Errors: ${errorCount}`
    );

    // Verify migration
    const usersWithUniqueId = await User.find({ uniqueId: { $exists: true } });
    const usersWithoutUniqueIdAfter = await User.find({
      uniqueId: { $exists: false },
    });

    logger.info(`Users with unique IDs: ${usersWithUniqueId.length}`);
    logger.info(
      `Users without unique IDs: ${usersWithoutUniqueIdAfter.length}`
    );

    // Show some examples
    const sampleUsers = await User.find({ uniqueId: { $exists: true } }).limit(
      5
    );
    logger.info("Sample users with unique IDs:");
    sampleUsers.forEach((user) => {
      logger.info(`- ${user.email}: ${user.uniqueId}`);
    });
  } catch (error) {
    logger.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUniqueIds();
}

export default migrateUniqueIds;
