import express from "express";
import { getMatchedUsers } from "../services/matchService.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/feed/matched-users
// @desc    Get matched users with compatibility scores
// @access  Private
router.get("/matched-users", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from protect middleware
    const matchedUsers = await getMatchedUsers(userId);

    res.json(matchedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
