import User from "../../models/User.js";
import Plan from "../../models/Plan.js";
import { createNotification } from "../../services/notificationService.js";

// Fetch all users with their subscription details
export const getAllUsersWithSubscriptions = async (req, res) => {
  try {
    const users = await User.find({}, "firstName lastName email subscription")
      .populate("subscription.plan");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users with subscriptions" });
  }
};

// Update a user's subscription plan by admin
export const updateUserSubscriptionByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { planId, expiresAt } = req.body;
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        subscription: {
          isActive: true,
          plan: plan._id,
          planName: plan.name,
          activatedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
        },
      },
      { new: true }
    ).populate("subscription.plan");

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    // Notify user
    await createNotification({
      user: updatedUser._id,
      type: "system",
      title: "Subscription Updated",
      message: `Your subscription has been updated by admin to plan: ${plan.name}.`,
      link: "/subscription",
    });

    res.json({ message: "Subscription updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to update subscription" });
  }
};

// Delete (cancel) a user's subscription by admin
export const deleteUserSubscriptionByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        subscription: {
          isActive: false,
          plan: null,
          planName: "",
          activatedAt: null,
          expiresAt: null,
        },
      },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    // Notify user
    await createNotification({
      user: updatedUser._id,
      type: "system",
      title: "Subscription Cancelled",
      message: "Your subscription has been cancelled by admin.",
      link: "/subscription",
    });

    res.json({ message: "Subscription cancelled", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};

// Get all plans for admin
export const getAllPlansForAdmin = async (req, res) => {
  try {
    const plans = await Plan.find({});
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch plans" });
  }
};

// Create a new plan
export const createPlanByAdmin = async (req, res) => {
  try {
    console.log("DEBUG: Received create plan request body:", req.body);

    let { name, price, features, duration, isActive } = req.body;
    price = typeof price === "string" ? Number(price) : price;
    duration = typeof duration === "string" ? Number(duration) : duration;

    // --- Robust features parsing ---
    if (typeof features === "string") {
      features = features.split(",").map(f => f.trim()).filter(f => f);
    }
    if (!Array.isArray(features) || features.length === 0) {
      return res.status(400).json({ error: "At least one feature is required" });
    }

    console.log("DEBUG: Parsed values:", { name, price, features, duration, isActive });

    // --- End robust validation ---
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Plan name is required" });
    }
    if (typeof price !== "number" || isNaN(price) || price < 0) {
      return res.status(400).json({ error: "Price must be a non-negative number" });
    }
    if (typeof duration !== "number" || isNaN(duration) || duration < 1) {
      return res.status(400).json({ error: "Duration must be a positive number" });
    }
    const plan = new Plan({ name, price, features, duration, isActive });
    await plan.save();
    res.status(201).json({ message: "Plan created", plan });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create plan" });
  }
};

// Update a plan
export const updatePlanByAdmin = async (req, res) => {
  try {
    console.log("DEBUG: Received update plan request body:", req.body);

    const { planId } = req.params;
    let { name, price, features, duration, isActive } = req.body;
    price = typeof price === "string" ? Number(price) : price;
    duration = typeof duration === "string" ? Number(duration) : duration;

    console.log("DEBUG: Parsed values:", { name, price, features, duration, isActive });

    if (!name || typeof name !== "string" || !name.trim()) {
      console.log("DEBUG: Validation failed: Plan name is required");
      return res.status(400).json({ error: "Plan name is required", debug: { name, price, features, duration, isActive } });
    }
    if (typeof price !== "number" || isNaN(price) || price < 0) {
      console.log("DEBUG: Validation failed: Price must be a non-negative number");
      return res.status(400).json({ error: "Price must be a non-negative number", debug: { name, price, features, duration, isActive } });
    }
    if (!features || (typeof features !== "string" && !Array.isArray(features))) {
      console.log("DEBUG: Validation failed: Features are required");
      return res.status(400).json({ error: "Features are required", debug: { name, price, features, duration, isActive } });
    }
    if (typeof features === "string") {
      features = features.split(",").map(f => f.trim()).filter(f => f);
    }
    if (!Array.isArray(features) || features.length === 0) {
      console.log("DEBUG: Validation failed: At least one feature is required");
      return res.status(400).json({ error: "At least one feature is required", debug: { name, price, features, duration, isActive } });
    }
    if (typeof duration !== "number" || isNaN(duration) || duration < 1) {
      console.log("DEBUG: Validation failed: Duration must be a positive number");
      return res.status(400).json({ error: "Duration must be a positive number", debug: { name, price, features, duration, isActive } });
    }
    const plan = await Plan.findByIdAndUpdate(
      planId,
      { name, price, features, duration, isActive },
      { new: true }
    );
    if (!plan) {
      console.log("DEBUG: Plan not found for update:", planId);
      return res.status(404).json({ error: "Plan not found" });
    }
    console.log("DEBUG: Plan updated successfully:", plan);
    res.json({ message: "Plan updated", plan });
  } catch (err) {
    console.log("DEBUG: Plan update error:", err);
    res.status(500).json({ error: err.message || "Failed to update plan" });
  }
};

// Delete a plan
export const deletePlanByAdmin = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await Plan.findByIdAndDelete(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json({ message: "Plan deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete plan" });
  }
   
}


