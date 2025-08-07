import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Create default admin
const createDefaultAdmin = async () => {
  try {
    console.log("🔍 Checking for existing admins...");

    const existingAdmins = await Admin.find({});
    console.log(`📊 Found ${existingAdmins.length} existing admins`);

    if (existingAdmins.length > 0) {
      console.log("✅ Admins already exist, no need to create default admin");
      existingAdmins.forEach((admin) => {
        console.log(`  - ${admin.email} (ID: ${admin._id})`);
      });
      return;
    }

    console.log("🔧 Creating default admin user...");

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    const admin = new Admin({
      email: "admin@matromonial.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });

    await admin.save();
    console.log("✅ Default admin created successfully!");
    console.log("📧 Email: admin@matromonial.com");
    console.log("🔑 Password: admin123");
    console.log("⚠️ Please change the password after first login!");
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await createDefaultAdmin();
  await mongoose.disconnect();
  console.log("✅ Script completed");
};

runScript();
