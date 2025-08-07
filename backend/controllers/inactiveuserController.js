import User from "../models/User.js";
import nodemailer from "nodemailer";// use nodemailer for sending emails

// Get inactive users
export const getInactiveUsers = async (req, res) => {
  try {
    let { days = "10", firstName = "", lastName = "" } = req.query;

    days = parseInt(days);
    if (isNaN(days)) {
      return res.status(400).json({ error: "Invalid 'days' parameter" });
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    console.log(`[INFO]: Fetching users inactive since ${cutoffDate.toISOString()}`);

    const query = {
      lastActive: { $lte: cutoffDate },
    };

    if (firstName.trim()) {
      query.firstName = { $regex: firstName, $options: "i" };
    }

    if (lastName.trim()) {
      query.lastName = { $regex: lastName, $options: "i" };
    }

    const inactiveUsers = await User.find(query).select("firstName lastName email lastActive");
    console.log(`[INFO]: Found ${inactiveUsers.length} inactive users.`);

    res.json(inactiveUsers);
  } catch (err) {
    console.error("Error fetching inactive users:", err);
    res.status(500).json({ error: "Failed to fetch inactive users" });
  }
};

// Follow-up or Cleanup Action
export const updateUserAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.actionLog.push({ action, date: new Date() });

    if (action === "cleanup") {
      await User.findByIdAndDelete(id);
      return res.json({ message: "🗑️ User deleted successfully (cleanup)" });
    }

    await user.save();
    res.json({ message: `${action} recorded.` });
  } catch (err) {
    console.error("Action update error:", err);
    res.status(500).json({ error: "Action update failed" });
  }
};

// Send reminder email
export const sendReminderEmail = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Matrimony Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "We miss you at Matrimony!",
      text: `Hi ${user.firstName},\n\nWe noticed you haven't logged in recently. Come back to explore new matches!\n\nWarm regards,\nMatrimony Team`,
    });

    user.actionLog.push({ action: "email-sent", date: new Date() });
    await user.save();

    res.json({ message: "Follow-up email sent" });
  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({ error: "Failed to send email", details: err.message });
  }
};

// Inactive user stats (10+, 15+, 30+)
export const getInactiveStats = async (req, res) => {
  try {
    const today = new Date();
    const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const week = await User.countDocuments({ lastActive: { $lte: tenDaysAgo } });
    const fortnight = await User.countDocuments({ lastActive: { $lte: fifteenDaysAgo } });
    const month = await User.countDocuments({ lastActive: { $lte: thirtyDaysAgo } });

    res.json({ week, fortnight, month });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Failed to fetch inactive stats" });
  }
};
