import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function checkUserPhotos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const user = await User.findOne({ uniqueId: "MM1002" });
    if (!user) {
      console.log("User MM1002 not found");
      return;
    }

    console.log("User found:", user.firstName, user.lastName);
    console.log("Photos array:", user.photos);
    console.log("Pending photos:", user.pendingChanges?.photos);

    if (user.photos && user.photos.length > 0) {
      console.log("\nPhoto URLs:");
      user.photos.forEach((photo, index) => {
        console.log(`${index + 1}. ${photo}`);
      });
    } else {
      console.log("No photos in main photos array");
    }

    if (user.pendingChanges?.photos && user.pendingChanges.photos.length > 0) {
      console.log("\nPending photo URLs:");
      user.pendingChanges.photos.forEach((photo, index) => {
        console.log(`${index + 1}. ${photo}`);
      });
    } else {
      console.log("No pending photos");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

checkUserPhotos();
