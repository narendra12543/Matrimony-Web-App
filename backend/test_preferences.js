import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const testPreferences = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log("No users found in database");
      return;
    }

    console.log("Test user found:", user._id);

    // Test getting preferences
    console.log("Current partnerPreferences:", user.partnerPreferences);

    // Test updating preferences
    const testPreferences = {
      partnerGender: "Female",
      partnerAgeMin: "25",
      partnerAgeMax: "35",
      partnerHeightMin: "5'2\"",
      partnerHeightMax: "5'8\"",
      partnerEducation: "Bachelor's",
      partnerOccupation: "Software Engineer",
      partnerIncome: "₹10-15 LPA",
      partnerCountry: "India",
      partnerLocation: "Maharashtra",
      partnerReligion: "Hindu",
      partnerCaste: "Any",
      partnerMaritalStatus: "Never Married",
      partnerAbout: "Looking for a caring and understanding partner",
    };

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { partnerPreferences: testPreferences },
      { new: true }
    );

    console.log("Updated user preferences:", updatedUser.partnerPreferences);

    // Test getting preferences again
    const userWithPrefs = await User.findById(user._id).select(
      "partnerPreferences"
    );
    console.log("Retrieved preferences:", userWithPrefs.partnerPreferences);

    console.log("✅ Partner preferences test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing preferences:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

testPreferences();
