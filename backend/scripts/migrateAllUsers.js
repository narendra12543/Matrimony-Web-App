import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  assignUniqueIdToUser,
  initializeIdCounter,
} from "../services/idGeneratorService.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log("🔑 MongoDB URI:", uri ? "Set" : "Not set");

    if (!uri) {
      throw new Error("MongoDB URI not found in environment variables");
    }

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const migrateAllUsers = async () => {
  try {
    console.log("🚀 Starting migration for all users...");

    // Connect to database
    await connectDB();

    // Initialize ID counter
    await initializeIdCounter();
    console.log("✅ ID counter initialized!");

    // Get all users without unique IDs
    const usersWithoutUniqueId = await User.find({
      uniqueId: { $exists: false },
    });
    console.log(
      `📊 Found ${usersWithoutUniqueId.length} users without unique IDs`
    );

    if (usersWithoutUniqueId.length === 0) {
      console.log("✅ All users already have unique IDs!");
      return;
    }

    // Get all users to check current state
    const allUsers = await User.find({});
    console.log(`📊 Total users in database: ${allUsers.length}`);

    const usersWithUniqueId = allUsers.filter((user) => user.uniqueId);
    console.log(`📊 Users with unique IDs: ${usersWithUniqueId.length}`);
    console.log(`📊 Users without unique IDs: ${usersWithoutUniqueId.length}`);

    // Display users with existing unique IDs
    if (usersWithUniqueId.length > 0) {
      console.log("\n📋 Users with existing unique IDs:");
      usersWithUniqueId.forEach((user) => {
        console.log(`   - ${user.email}: ${user.uniqueId}`);
      });
    }

    // Display users that will get new unique IDs
    console.log("\n📋 Users that will get new unique IDs:");
    usersWithoutUniqueId.forEach((user) => {
      console.log(`   - ${user.email} (${user._id})`);
    });

    // Confirm before proceeding
    console.log("\n⚠️  This will assign unique IDs to all users without them.");
    console.log("   Press Ctrl+C to cancel, or wait 5 seconds to continue...");

    // Wait 5 seconds for confirmation
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Assign unique IDs to users without them
    console.log("\n🔄 Assigning unique IDs...");
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutUniqueId) {
      try {
        await assignUniqueIdToUser(user._id);
        console.log(`✅ Assigned unique ID to: ${user.email}`);
        successCount++;
      } catch (error) {
        console.error(
          `❌ Failed to assign unique ID to ${user.email}:`,
          error.message
        );
        errorCount++;
      }
    }

    // Final summary
    console.log("\n📊 Migration Summary:");
    console.log(`✅ Successfully assigned: ${successCount} users`);
    if (errorCount > 0) {
      console.log(`❌ Failed to assign: ${errorCount} users`);
    }

    // Display all users with their unique IDs
    const updatedUsers = await User.find({ uniqueId: { $exists: true } }).sort({
      uniqueId: 1,
    });
    console.log("\n📋 All users with unique IDs:");
    updatedUsers.forEach((user) => {
      console.log(`   - ${user.uniqueId}: ${user.email}`);
    });

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllUsers();
}

export default migrateAllUsers;
