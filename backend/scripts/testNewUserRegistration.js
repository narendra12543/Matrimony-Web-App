import mongoose from "mongoose";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Notification from "../models/Notification.js";
import { notifyNewUserRegistration } from "../services/adminNotificationService.js";
import dotenv from "dotenv";

dotenv.config();

const testNewUserRegistration = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Create a test user (simulating registration)
    const testUser = new User({
      firstName: "Test",
      lastName: "User",
      email: `testuser${Date.now()}@example.com`,
      password: "hashedpassword",
      isNewUser: true,
      approvalStatus: "pending",
      isEmailVerified: true, // Skip email verification for test
    });

    await testUser.save();
    console.log("✅ Test user created:", testUser.email);

    // Test admin notification
    console.log("🔔 Testing admin notification for new user...");
    await notifyNewUserRegistration({
      _id: testUser._id,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
    });

    // Check if user appears in pending approvals
    const pendingUsers = await User.find({ approvalStatus: "pending" });
    console.log(`Found ${pendingUsers.length} users with pending approval`);

    // Check admin notifications
    const admins = await Admin.find({});
    const adminNotifications = await Notification.find({
      user: { $in: admins.map((admin) => admin._id) },
      type: { $regex: /^admin_/ },
    });

    console.log(`Found ${adminNotifications.length} admin notifications`);

    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
    console.log("✅ Test user cleaned up");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error testing new user registration:", error);
    process.exit(1);
  }
};

testNewUserRegistration();
