import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the Verification model
import Verification from "../models/Verification.js";

const fixVerificationPaths = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all verification records
    const verifications = await Verification.find({});
    console.log(`Found ${verifications.length} verification records`);

    let fixedCount = 0;

    for (const verification of verifications) {
      let needsUpdate = false;
      const updates = {};

      // Check and fix documentFrontPath
      if (
        verification.documentFrontPath &&
        verification.documentFrontPath.includes("C:\\")
      ) {
        const relativePath = path.relative(
          path.join(__dirname, "../uploads"),
          verification.documentFrontPath
        );
        updates.documentFrontPath = relativePath;
        needsUpdate = true;
        console.log(
          `Fixing front path: ${verification.documentFrontPath} -> ${relativePath}`
        );
      }

      // Check and fix documentBackPath
      if (
        verification.documentBackPath &&
        verification.documentBackPath.includes("C:\\")
      ) {
        const relativePath = path.relative(
          path.join(__dirname, "../uploads"),
          verification.documentBackPath
        );
        updates.documentBackPath = relativePath;
        needsUpdate = true;
        console.log(
          `Fixing back path: ${verification.documentBackPath} -> ${relativePath}`
        );
      }

      // Update the record if needed
      if (needsUpdate) {
        await Verification.findByIdAndUpdate(verification._id, updates);
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} verification records`);
    console.log("Path fixing completed successfully!");
  } catch (error) {
    console.error("Error fixing verification paths:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the script
fixVerificationPaths();
