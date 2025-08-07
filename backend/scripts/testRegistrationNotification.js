import mongoose from "mongoose";
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

// Test registration notification
const testRegistrationNotification = async () => {
  try {
    console.log("🔍 Testing new user registration notification...");

    const testUserData = {
      _id: "test-registration-user-id",
      firstName: "Test",
      lastName: "Registration",
      email: "test.registration@example.com",
    };

    console.log("🔔 Calling notifyNewUserRegistration with:", testUserData);
    await notifyNewUserRegistration(testUserData);
    console.log("✅ Registration notification test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing registration notification:", error);
    console.error("❌ Error stack:", error.stack);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testRegistrationNotification();
  await mongoose.disconnect();
  console.log("✅ Test completed");
};

runTest();
