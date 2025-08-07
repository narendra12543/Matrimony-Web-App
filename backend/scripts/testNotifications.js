import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { createNotification } from "../services/notificationService.js";
import { notifyNewUserRegistration } from "../services/adminNotificationService.js";
import dotenv from "dotenv";

dotenv.config();

const testNotifications = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check for users
    const users = await User.find({}).limit(5);
    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      console.log("No users found. Please create a user first.");
      return;
    }

    // Check for admins
    const admins = await Admin.find({});
    console.log(`Found ${admins.length} admins`);

    if (admins.length === 0) {
      console.log("No admins found. Please create an admin first.");
      return;
    }

    // Test user notification
    const testUser = users[0];
    console.log(`Testing notification for user: ${testUser.email}`);

    try {
      const notification = await createNotification({
        user: testUser._id,
        type: "profile_pending",
        title: "Test Notification",
        message: "This is a test notification for pending approval.",
        link: "/profile",
      });
      console.log(
        "✅ User notification created successfully:",
        notification._id
      );
    } catch (error) {
      console.error("❌ Error creating user notification:", error.message);
    }

    // Test admin notification
    try {
      await notifyNewUserRegistration({
        _id: testUser._id,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
      });
      console.log("✅ Admin notification sent successfully");
    } catch (error) {
      console.error("❌ Error sending admin notification:", error.message);
    }

    // Check notifications in database
    const userNotifications = await Notification.find({ user: testUser._id });
    console.log(`Found ${userNotifications.length} notifications for user`);

    const adminNotifications = await Notification.find({
      user: { $in: admins.map((admin) => admin._id) },
      type: { $regex: /^admin_/ },
    });
    console.log(`Found ${adminNotifications.length} admin notifications`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error testing notifications:", error);
    process.exit(1);
  }
};

testNotifications();
