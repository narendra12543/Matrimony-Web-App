import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Import models
import User from "../models/User.js";
import Subscriber from "../models/Subscriber.js";
import Message from "../models/Message.js";

const fixImageUrls = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    let fixedCount = 0;

    // Fix User photos
    console.log("Checking User photos...");
    const users = await User.find({});
    for (const user of users) {
      if (user.photos && Array.isArray(user.photos)) {
        let needsUpdate = false;
        const updatedPhotos = user.photos.map(photo => {
          if (photo && typeof photo === 'string' && photo.includes('localhost:5173')) {
            const fixedPhoto = photo.replace('http://localhost:5173', 'http://localhost:5000');
            console.log(`Fixing User photo: ${photo} -> ${fixedPhoto}`);
            needsUpdate = true;
            return fixedPhoto;
          }
          return photo;
        });

        if (needsUpdate) {
          await User.findByIdAndUpdate(user._id, { photos: updatedPhotos });
          fixedCount++;
        }
      }
    }

    // Fix Subscriber photos
    console.log("Checking Subscriber photos...");
    const subscribers = await Subscriber.find({});
    for (const subscriber of subscribers) {
      if (subscriber.photos && Array.isArray(subscriber.photos)) {
        let needsUpdate = false;
        const updatedPhotos = subscriber.photos.map(photo => {
          if (photo && typeof photo === 'string' && photo.includes('localhost:5173')) {
            const fixedPhoto = photo.replace('http://localhost:5173', 'http://localhost:5000');
            console.log(`Fixing Subscriber photo: ${photo} -> ${fixedPhoto}`);
            needsUpdate = true;
            return fixedPhoto;
          }
          return photo;
        });

        if (needsUpdate) {
          await Subscriber.findByIdAndUpdate(subscriber._id, { photos: updatedPhotos });
          fixedCount++;
        }
      }
    }

    // Fix Message file URLs
    console.log("Checking Message file URLs...");
    const messages = await Message.find({});
    for (const message of messages) {
      if (message.file && message.file.url && typeof message.file.url === 'string' && message.file.url.includes('localhost:5173')) {
        const fixedUrl = message.file.url.replace('http://localhost:5173', 'http://localhost:5000');
        console.log(`Fixing Message file URL: ${message.file.url} -> ${fixedUrl}`);
        await Message.findByIdAndUpdate(message._id, { 
          'file.url': fixedUrl 
        });
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} records with incorrect image URLs`);
    console.log("Image URL fixing completed successfully!");

  } catch (error) {
    console.error("Error fixing image URLs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the script
fixImageUrls(); 