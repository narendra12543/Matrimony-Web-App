import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import { notifyNewUserRegistration } from "../services/adminNotificationService.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Test admin notification system
const testAdminNotifications = async () => {
  try {
    console.log("🔍 Testing admin notification system...");

    // Check if there are any admins
    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} admins in database:`);
    admins.forEach((admin) => {
      console.log(`  - ${admin.email} (ID: ${admin._id})`);
    });

    if (admins.length === 0) {
      console.log(
        "❌ No admins found! This is why notifications aren't being sent."
      );
      console.log(
        "💡 Run the createAdmin.js script to create a default admin."
      );
      return;
    }

    // Test sending a new user registration notification
    console.log("🔔 Testing new user registration notification...");
    const testUserData = {
      _id: "test-user-id",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
    };

    await notifyNewUserRegistration(testUserData);
    console.log("✅ Test notification sent successfully!");
  } catch (error) {
    console.error("❌ Error testing admin notifications:", error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testAdminNotifications();
  await mongoose.disconnect();
  console.log("✅ Test completed");
};

runTest();
