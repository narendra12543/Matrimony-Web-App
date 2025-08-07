import Visitor from "../models/Visitor.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";

export const getVisitors = async (req, res) => {
  try {
    const { visitedUserId } = req.query;
    if (!visitedUserId) {
      return res.status(400).json({ message: "visitedUserId is required" });
    }
    const visitors = await Visitor.find({ visitedUserId })
      .populate("visitorUserId", "firstName lastName photos")
      .sort({ visitedAt: -1 });
    res.status(200).json(visitors);
  } catch (err) {
    console.error("Error fetching visitors:", err);
    res.status(500).json({ message: err.message });
  }
};

export const addVisitor = async (req, res) => {
  const { visitedUserId, visitorUserId } = req.body;
  if (!visitedUserId || !visitorUserId) {
    return res
      .status(400)
      .json({ message: "visitedUserId and visitorUserId are required" });
  }
  try {
    // Prevent a user from visiting their own profile
    if (visitedUserId === visitorUserId) {
      return res.status(200).json({ message: "Cannot visit own profile" });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let visitorEntry = await Visitor.findOne({
      visitedUserId,
      visitorUserId,
      visitedAt: { $gte: twentyFourHoursAgo },
    });

    if (visitorEntry) {
      // If already visited recently, just update the timestamp
      visitorEntry.visitedAt = new Date();
      await visitorEntry.save();
      res.status(200).json({ message: "Visitor entry updated" });
    } else {
      // Create a new visitor entry
      const newVisitor = new Visitor({ visitedUserId, visitorUserId });
      await newVisitor.save();

      // Increment profileViews count for the visited user
      await User.findByIdAndUpdate(visitedUserId, {
        $inc: { profileViews: 1 },
      });

      // Send notification to the visited user
      const visitorUser = await User.findById(visitorUserId);
      if (visitorUser) {
        await createNotification({
          user: visitedUserId,
          type: "profile_visit",
          title: "New Profile Visit!",
          message: `${visitorUser.firstName} ${visitorUser.lastName} viewed your profile.`, // Use visitor's name
          fromUser: visitorUserId,
          link: `/profile/${visitorUserId}`,
        });
      }

      res.status(201).json(newVisitor);
    }
  } catch (err) {
    console.error("Error adding visitor:", err);
    res.status(500).json({ message: err.message });
  }
};
