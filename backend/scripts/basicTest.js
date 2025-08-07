console.log("🚀 Basic test starting...");

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log("📦 Dependencies loaded");

const connectDB = async () => {
  try {
    console.log("🔌 Attempting to connect to MongoDB...");
    console.log("🔑 MongoDB URI:", process.env.MONGO_URI ? "Set" : "Not set");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const basicTest = async () => {
  try {
    console.log("🧪 Running basic test...");

    await connectDB();

    console.log("📊 Checking database collections...");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📋 Available collections:",
      collections.map((c) => c.name)
    );

    console.log("🎉 Basic test completed successfully!");
  } catch (error) {
    console.error("❌ Basic test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

basicTest();
