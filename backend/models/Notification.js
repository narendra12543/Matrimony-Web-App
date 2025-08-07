// Notification schema

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // recipient
  type: {
    type: String,
    enum: [
      "welcome",
      "verification",
      "verification_pending",
      "verification_approved",
      "profile_approved",
      "profile_rejected",
      "profile_pending",
      "photo_pending",
      "photo_approved",
      "photo_rejected",
      "new_request",
      "profile_visit",
      "message",
      "system",
      "password_change",
      "interest_sent",
      "interest_accepted",
      "interest_rejected",
      "request_cancelled",
      "admin",
      // Admin notification types
      "admin_new_user",
      "admin_new_user_approved",
      "admin_new_user_rejected",
      "admin_verification_request",
      "admin_suspicious_activity",
      "admin_user_report",
      "admin_system_alert",
      "admin_payment_issue",
      "admin_high_traffic",
      "admin_security_breach",
      "admin_subscription_expiry",
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true }, // notification text
  link: { type: String }, // e.g., /profile/userId
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // related chat (if any)
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // sender (if any)
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  data: { type: mongoose.Schema.Types.Mixed }, // Additional data for admin notifications
});

export default mongoose.model("Notification", notificationSchema);
