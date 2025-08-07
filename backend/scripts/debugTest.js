import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  assignUniqueIdToUser,
  generateUniqueId,
} from "../services/idGeneratorService.js";
import { initializeIdCounter } from "../services/idGeneratorService.js";
import User from "../models/User.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const debugTest = async () => {
  try {
    console.log("🚀 Starting debug test...");

    await connectDB();
    await initializeIdCounter();

    console.log("🧪 Testing unique ID generation...");

    // Test 1: Generate unique ID
    const uniqueId = await generateUniqueId();
    console.log(`✅ Generated unique ID: ${uniqueId}`);

    // Test 2: Get a user and assign unique ID
    const user = await User.findOne();
    if (user) {
      console.log(`Found user: ${user.email}`);
      const assignedId = await assignUniqueIdToUser(user._id);
      console.log(`✅ Assigned unique ID: ${assignedId}`);
    } else {
      console.log("No users found in database");
    }

    // Test 3: Check all users with unique IDs
    const usersWithIds = await User.find({ uniqueId: { $exists: true } });
    console.log(`Users with unique IDs: ${usersWithIds.length}`);

    usersWithIds.forEach((user) => {
      console.log(`- ${user.email}: ${user.uniqueId}`);
    });

    console.log("🎉 Debug test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugTest();
}

export default debugTest;
