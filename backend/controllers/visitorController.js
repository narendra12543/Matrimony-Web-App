import Visitor from "../models/Visitor.js";

export const getVisitors = async (req, res) => {
  try {
    const { visitedUserId } = req.query;
    if (!visitedUserId) {
      return res.status(400).json({ message: "visitedUserId is required" });
    }
    const visitors = await Visitor.find({ visitedUserId })
      .populate("visitorUserId", "firstName lastName avatar")
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
    return res.status(400).json({ message: "visitedUserId and visitorUserId are required" });
  }
  try {
    const newVisitor = new Visitor({ visitedUserId, visitorUserId });
    await newVisitor.save();
    res.status(201).json(newVisitor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
