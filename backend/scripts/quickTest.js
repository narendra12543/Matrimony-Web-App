console.log("🚀 Quick test starting...");

import mongoose from "mongoose";
import dotenv from "dotenv";
import { generateUniqueId, assignUniqueIdToUser, initializeIdCounter } from "../services/idGeneratorService.js";
import User from "../models/User.js";

dotenv.config();

console.log("📦 Dependencies loaded");

const quickTest = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB!");

    console.log("🔧 Initializing ID counter...");
    await initializeIdCounter();
    console.log("✅ ID counter initialized!");

    console.log("🧪 Testing unique ID generation...");
    const uniqueId = await generateUniqueId();
    console.log(`✅ Generated unique ID: ${uniqueId}`);

    console.log("👤 Finding a user...");
    const user = await User.findOne();
    if (user) {
      console.log(`Found user: ${user.email}`);
      const assignedId = await assignUniqueIdToUser(user._id);
      console.log(`✅ Assigned unique ID: ${assignedId}`);
    } else {
      console.log("No users found in database");
    }

    console.log("📊 Checking all users with unique IDs...");
    const usersWithIds = await User.find({ uniqueId: { $exists: true } });
    console.log(`Users with unique IDs: ${usersWithIds.length}`);
    
    usersWithIds.forEach(user => {
      console.log(`- ${user.email}: ${user.uniqueId}`);
    });

    console.log("🎉 Quick test completed successfully!");

  } catch (error) {
    console.error("❌ Quick test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

quickTest(); 