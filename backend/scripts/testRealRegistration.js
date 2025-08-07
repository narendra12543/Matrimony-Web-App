import mongoose from "mongoose";
import { registerUser } from "../services/authService.js";
import { notifyNewUserRegistration } from "../services/adminNotificationService.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Notification from "../models/Notification.js";
import dotenv from "dotenv";

dotenv.config();

const testRealRegistration = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Simulate the exact registration flow
    console.log("🔔 Starting registration simulation...");

    const userData = {
      email: `realuser${Date.now()}@example.com`,
      password: "testpassword123",
      firstName: "Real",
      lastName: "User",
      phone: "1234567890",
      terms: true,
    };

    console.log("🔔 Calling registerUser service...");
    const {
      userData: newUser,
      token,
      emailVerificationToken,
    } = await registerUser(userData);
    console.log("✅ User created by registerUser service:", newUser.email);

    // Now simulate what authController does after registerUser
    console.log("🔔 Setting up user properties (like authController does)...");

    // Initialize free trial for new users
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialStartDate.getDate() + 3); // 3 days free trial

    newUser.trial = {
      startDate: trialStartDate,
      endDate: trialEndDate,
      isActive: true,
    };
    newUser.isNewUser = true; // Explicitly set isNewUser to true
    newUser.approvalStatus = "pending"; // Explicitly set approvalStatus to pending
    await newUser.save();
    console.log("✅ User properties set:", {
      isNewUser: newUser.isNewUser,
      approvalStatus: newUser.approvalStatus,
    });

    // Test admin notification
    console.log("🔔 Testing admin notification for new user...");
    try {
      await notifyNewUserRegistration({
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      });
      console.log("✅ Admin notification sent successfully");
    } catch (adminNotificationError) {
      console.error(
        "❌ Error sending admin notification:",
        adminNotificationError
      );
      console.error("❌ Error stack:", adminNotificationError.stack);
    }

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
    await User.findByIdAndDelete(newUser._id);
    console.log("✅ Test user cleaned up");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error testing real registration:", error);
    process.exit(1);
  }
};

testRealRegistration();
