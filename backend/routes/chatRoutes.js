import express from "express";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all chats for a user
router.get("/", authenticate, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate(
        "participants",
        "firstName lastName email avatar photos isOnline lastSeen"
      )
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create or get existing chat
router.post("/", authenticate, async (req, res) => {
  try {
    const { participantId } = req.body;

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, participantId] },
    }).populate(
      "participants",
      "firstName lastName email avatar photos isOnline lastSeen"
    );

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [req.user._id, participantId],
      });
      await chat.save();
      await chat.populate(
        "participants",
        "firstName lastName email avatar photos isOnline lastSeen"
      );
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Search users
router.get("/users/search", authenticate, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { firstName: { $regex: query, $options: "i" } },
            { lastName: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
      ],
    })
      .select("firstName lastName email avatar isOnline lastSeen")
      .limit(10);
    const mappedUsers = users.map((user) => ({
      ...user,
      name:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email, // fallback if no names
    }));
    res.json(mappedUsers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
