import mongoose from "mongoose";
import User from "../models/User.js";
import Subscriber from "../models/Subscriber.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function fixSubscriberIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all users without subscriberId
    const usersWithoutSubscriber = await User.find({
      subscriberId: { $exists: false },
    });
    console.log(
      `Found ${usersWithoutSubscriber.length} users without subscriberId`
    );

    for (const user of usersWithoutSubscriber) {
      try {
        // Check if subscriber already exists for this email
        let subscriber = await Subscriber.findOne({ email: user.email });

        if (!subscriber) {
          // Create new subscriber
          subscriber = new Subscriber({
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.email,
            email: user.email,
            status: "active", // Set as active since user is already registered
          });
          await subscriber.save();
          console.log(`Created subscriber for user: ${user.email}`);
        }

        // Update user with subscriberId
        user.subscriberId = subscriber._id;
        await user.save();
        console.log(
          `Updated user ${user.email} with subscriberId: ${subscriber._id}`
        );
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error.message);
      }
    }

    console.log("Subscriber ID fix completed!");
  } catch (error) {
    console.error("Error fixing subscriber IDs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
fixSubscriberIds();
