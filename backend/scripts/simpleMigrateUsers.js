console.log("🚀 Simple user migration starting...");

import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  assignUniqueIdToUser,
  initializeIdCounter,
} from "../services/idGeneratorService.js";
import User from "../models/User.js";

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

const simpleMigrateUsers = async () => {
  try {
    console.log("📦 Dependencies loaded");

    // Connect to database
    await connectDB();

    // Initialize ID counter
    await initializeIdCounter();
    console.log("✅ ID counter initialized!");

    // Get all users
    const allUsers = await User.find({});
    console.log(`📊 Total users in database: ${allUsers.length}`);

    // Get users without unique IDs
    const usersWithoutUniqueId = await User.find({
      uniqueId: { $exists: false },
    });
    console.log(`📊 Users without unique IDs: ${usersWithoutUniqueId.length}`);

    if (usersWithoutUniqueId.length === 0) {
      console.log("✅ All users already have unique IDs!");

      // Show existing users with unique IDs
      const usersWithUniqueId = await User.find({
        uniqueId: { $exists: true },
      }).sort({ uniqueId: 1 });
      console.log("\n📋 All users with unique IDs:");
      usersWithUniqueId.forEach((user) => {
        console.log(`   - ${user.uniqueId}: ${user.email}`);
      });
      return;
    }

    // Show users that will get unique IDs
    console.log("\n📋 Users that will get unique IDs:");
    usersWithoutUniqueId.forEach((user) => {
      console.log(`   - ${user.email}`);
    });

    // Assign unique IDs
    console.log("\n🔄 Assigning unique IDs...");
    let successCount = 0;

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
      }
    }

    console.log(`\n📊 Successfully assigned: ${successCount} users`);

    // Show all users with unique IDs
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

simpleMigrateUsers();
