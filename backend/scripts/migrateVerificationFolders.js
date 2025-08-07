import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Verification from "../models/Verification.js";
import Subscriber from "../models/Subscriber.js";
import User from "../models/User.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrateVerificationFolders = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all verification records
    const verifications = await Verification.find({});
    console.log(`📋 Found ${verifications.length} verification records`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const verification of verifications) {
      try {
        console.log(`\n🔄 Processing verification ID: ${verification._id}`);
        console.log(`👤 Subscriber ID: ${verification.subscriber}`);
        console.log(`📄 Document Type: ${verification.documentType}`);

        const subscriberId = verification.subscriber.toString();

        // Get the user's uniqueId for folder structure
        const user = await User.findOne({ subscriberId: verification.subscriber });
        if (!user || !user.uniqueId) {
          console.log(`⚠️ User or uniqueId not found for subscriber: ${subscriberId}, skipping...`);
          continue;
        }

        const uniqueId = user.uniqueId;
        console.log(`🆔 Using uniqueId: ${uniqueId}`);

        // Create user-specific directory structure using uniqueId
        const userVerificationDir = path.join(
          __dirname,
          "../uploads/users",
          uniqueId,
          "verification"
        );
        const documentTypeDir = path.join(
          userVerificationDir,
          verification.documentType
        );

        // Create directories if they don't exist
        if (!fs.existsSync(userVerificationDir)) {
          fs.mkdirSync(userVerificationDir, { recursive: true });
          console.log(`📁 Created directory: ${userVerificationDir}`);
        }
        if (!fs.existsSync(documentTypeDir)) {
          fs.mkdirSync(documentTypeDir, { recursive: true });
          console.log(`📁 Created directory: ${documentTypeDir}`);
        }

        // Handle front document
        if (verification.documentFrontPath) {
          const oldFrontPath = path.join(
            __dirname,
            "../uploads",
            verification.documentFrontPath
          );

          if (fs.existsSync(oldFrontPath)) {
            // Extract filename from old path
            const oldFileName = path.basename(oldFrontPath);
            const fileExtension = path.extname(oldFileName);

            // Create new filename
            const newFrontFileName = `${
              verification.documentType
            }_front_${Date.now()}${fileExtension}`;
            const newFrontPath = path.join(documentTypeDir, newFrontFileName);

            // Move file
            fs.copyFileSync(oldFrontPath, newFrontPath);
            console.log(
              `📄 Moved front document: ${oldFileName} → ${newFrontFileName}`
            );

            // Update database record
            const newRelativeFrontPath = path.relative(
              path.join(__dirname, "../uploads"),
              newFrontPath
            );
            verification.documentFrontPath = newRelativeFrontPath;

            // Delete old file
            fs.unlinkSync(oldFrontPath);
            console.log(`🗑️ Deleted old front document: ${oldFrontPath}`);
          } else {
            console.log(`⚠️ Front document not found: ${oldFrontPath}`);
          }
        }

        // Handle back document
        if (verification.documentBackPath) {
          const oldBackPath = path.join(
            __dirname,
            "../uploads",
            verification.documentBackPath
          );

          if (fs.existsSync(oldBackPath)) {
            // Extract filename from old path
            const oldFileName = path.basename(oldBackPath);
            const fileExtension = path.extname(oldFileName);

            // Create new filename
            const newBackFileName = `${
              verification.documentType
            }_back_${Date.now()}${fileExtension}`;
            const newBackPath = path.join(documentTypeDir, newBackFileName);

            // Move file
            fs.copyFileSync(oldBackPath, newBackPath);
            console.log(
              `📄 Moved back document: ${oldFileName} → ${newBackFileName}`
            );

            // Update database record
            const newRelativeBackPath = path.relative(
              path.join(__dirname, "../uploads"),
              newBackPath
            );
            verification.documentBackPath = newRelativeBackPath;

            // Delete old file
            fs.unlinkSync(oldBackPath);
            console.log(`🗑️ Deleted old back document: ${oldBackPath}`);
          } else {
            console.log(`⚠️ Back document not found: ${oldBackPath}`);
          }
        }

        // Save updated verification record
        await verification.save();
        console.log(`✅ Updated verification record in database`);

        migratedCount++;
      } catch (error) {
        console.error(
          `❌ Error processing verification ${verification._id}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(
      `✅ Successfully migrated: ${migratedCount} verification records`
    );
    console.log(`❌ Errors: ${errorCount} verification records`);

    // Clean up old verification directory if empty
    const oldVerificationDir = path.join(__dirname, "../uploads/verification");
    if (fs.existsSync(oldVerificationDir)) {
      const files = fs.readdirSync(oldVerificationDir);
      if (files.length === 0) {
        fs.rmdirSync(oldVerificationDir);
        console.log(
          `🗑️ Removed empty old verification directory: ${oldVerificationDir}`
        );
      } else {
        console.log(
          `⚠️ Old verification directory still contains ${files.length} files: ${oldVerificationDir}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the migration
migrateVerificationFolders();
