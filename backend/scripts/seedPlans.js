import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Plan from "../models/Plan.js";

dotenv.config(); // Load environment variables

const seedPlans = async () => {
  await connectDB(); // Connect to the database

  const plans = [
    {
      name: "Basic",
      price: 0,
      features: ["3 requests per week", "View blurred visitors"],
      duration: 30, // Days
      isActive: true,
    },
    {
      name: "Premium",
      price: 499,
      features: ["10 requests per week", "View clear visitors", "Voice Call"],
      duration: 30,
      isActive: true,
    },
    {
      name: "Elite VIP",
      price: 999,
      features: [
        "Unlimited requests",
        "View clear visitors",
        "Voice Call",
        "Video Call",
      ],
      duration: 30,
      isActive: true,
    },
  ];

  for (const planData of plans) {
    try {
      const existingPlan = await Plan.findOne({ name: planData.name });
      if (existingPlan) {
        console.log(`Plan '${planData.name}' already exists. Skipping.`);
      } else {
        const newPlan = new Plan(planData);
        await newPlan.save();
        console.log(`Plan '${planData.name}' added successfully.`);
      }
    } catch (error) {
      console.error(`Error seeding plan '${planData.name}':`, error.message);
    }
  }

  console.log("Plan seeding complete.");
  mongoose.disconnect();
};

seedPlans();
