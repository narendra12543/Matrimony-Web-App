// Notification schema

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // recipient
  type: { type: String, enum: ["message", "system"], default: "message" },
  message: { type: String }, // notification text
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // related chat (if any)
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // sender (if any)
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Notification", notificationSchema);
