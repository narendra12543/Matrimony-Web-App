console.log("🚀 Quick file upload test starting...");

import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  uploadProfilePhoto,
  uploadChatFile,
  uploadVerificationDocument,
} from "../services/fileStorageService.js";
import { assignUniqueIdToUser } from "../services/idGeneratorService.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";

dotenv.config();

console.log("📦 Dependencies loaded");

const createTestFile = (content, filename) => {
  const testDir = path.join(process.cwd(), "uploads", "temp");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const filePath = path.join(testDir, filename);
  fs.writeFileSync(filePath, content);

  return {
    path: filePath,
    originalname: filename,
    mimetype: filename.endsWith(".jpg")
      ? "image/jpeg"
      : filename.endsWith(".pdf")
      ? "application/pdf"
      : filename.endsWith(".mp4")
      ? "video/mp4"
      : "text/plain",
    size: content.length,
  };
};

const quickFileTest = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB!");

    console.log("👤 Getting test user...");
    const testUser = await User.findOne();
    if (!testUser) {
      console.log("❌ No users found in database");
      return;
    }

    console.log(`Found user: ${testUser.email}`);
    const uniqueId = await assignUniqueIdToUser(testUser._id);
    console.log(`User unique ID: ${uniqueId}`);

    console.log("📸 Testing profile photo upload...");
    const testPhoto = createTestFile("fake image data", "test_photo.jpg");
    try {
      const photoResult = await uploadProfilePhoto(testPhoto, uniqueId);
      console.log("✅ Profile photo upload successful:", photoResult.fileName);
    } catch (error) {
      console.error("❌ Profile photo upload failed:", error.message);
    }

    console.log("💬 Testing chat image upload...");
    const testChatImage = createTestFile(
      "fake chat image data",
      "test_chat_image.jpg"
    );
    try {
      const chatImageResult = await uploadChatFile(
        testChatImage,
        uniqueId,
        "image"
      );
      console.log("✅ Chat image upload successful:", chatImageResult.fileName);
    } catch (error) {
      console.error("❌ Chat image upload failed:", error.message);
    }

    console.log("🆔 Testing verification document upload...");
    const testVerificationDoc = createTestFile(
      "fake verification data",
      "test_verification.pdf"
    );
    try {
      const verificationResult = await uploadVerificationDocument(
        testVerificationDoc,
        uniqueId,
        "aadhaar",
        "front"
      );
      console.log(
        "✅ Verification document upload successful:",
        verificationResult.fileName
      );
    } catch (error) {
      console.error("❌ Verification document upload failed:", error.message);
    }

    console.log("📁 Checking directory structure...");
    const userDir = path.join(process.cwd(), "uploads", "users", uniqueId);
    if (fs.existsSync(userDir)) {
      console.log("✅ User directory created:", userDir);

      const subdirs = fs.readdirSync(userDir);
      console.log("📂 Subdirectories:", subdirs);

      for (const subdir of subdirs) {
        const subdirPath = path.join(userDir, subdir);
        if (fs.statSync(subdirPath).isDirectory()) {
          const files = fs.readdirSync(subdirPath);
          console.log(`📂 ${subdir}: ${files.length} files`);
        }
      }
    } else {
      console.error("❌ User directory not created");
    }

    console.log("🎉 Quick file upload test completed!");
  } catch (error) {
    console.error("❌ Quick file test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

quickFileTest();
