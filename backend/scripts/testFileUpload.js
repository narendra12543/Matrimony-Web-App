import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  uploadProfilePhoto,
  uploadChatFile,
  uploadVerificationDocument,
} from "../services/fileStorageService.js";
import { assignUniqueIdToUser } from "../services/idGeneratorService.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import fs from "fs";
import path from "path";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

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

const testFileUpload = async () => {
  try {
    await connectDB();

    logger.info("🧪 Testing file upload system...");

    // Get a test user
    const testUser = await User.findOne();
    if (!testUser) {
      logger.error("No users found in database. Please create a user first.");
      return;
    }

    // Ensure user has unique ID
    const uniqueId = await assignUniqueIdToUser(testUser._id);
    logger.info(`Testing with user: ${testUser.email} (${uniqueId})`);

    // Test 1: Profile photo upload
    logger.info("📸 Testing profile photo upload...");
    const testPhoto = createTestFile("fake image data", "test_photo.jpg");
    try {
      const photoResult = await uploadProfilePhoto(testPhoto, uniqueId);
      logger.info("✅ Profile photo upload successful:", photoResult.fileName);
    } catch (error) {
      logger.error("❌ Profile photo upload failed:", error.message);
    }

    // Test 2: Chat image upload
    logger.info("💬 Testing chat image upload...");
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
      logger.info("✅ Chat image upload successful:", chatImageResult.fileName);
    } catch (error) {
      logger.error("❌ Chat image upload failed:", error.message);
    }

    // Test 3: Chat document upload
    logger.info("📄 Testing chat document upload...");
    const testChatDoc = createTestFile(
      "fake document data",
      "test_chat_doc.pdf"
    );
    try {
      const chatDocResult = await uploadChatFile(
        testChatDoc,
        uniqueId,
        "document"
      );
      logger.info(
        "✅ Chat document upload successful:",
        chatDocResult.fileName
      );
    } catch (error) {
      logger.error("❌ Chat document upload failed:", error.message);
    }

    // Test 4: Verification document upload
    logger.info("🆔 Testing verification document upload...");
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
      logger.info(
        "✅ Verification document upload successful:",
        verificationResult.fileName
      );
    } catch (error) {
      logger.error("❌ Verification document upload failed:", error.message);
    }

    // Check directory structure
    logger.info("📁 Checking directory structure...");
    const userDir = path.join(process.cwd(), "uploads", "users", uniqueId);
    if (fs.existsSync(userDir)) {
      logger.info("✅ User directory created:", userDir);

      const subdirs = fs.readdirSync(userDir);
      logger.info("📂 Subdirectories:", subdirs);

      for (const subdir of subdirs) {
        const subdirPath = path.join(userDir, subdir);
        if (fs.statSync(subdirPath).isDirectory()) {
          const files = fs.readdirSync(subdirPath);
          logger.info(`📂 ${subdir}: ${files.length} files`);
        }
      }
    } else {
      logger.error("❌ User directory not created");
    }

    logger.info("🎉 File upload system test completed!");
  } catch (error) {
    logger.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFileUpload();
}

export default testFileUpload;
