import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

const JWT_SECRET = process.env.JWT_SECRET || "yoursecret";
const ADMIN_JWT_SECRET = process.env.JWT_SECRET || "adminsecret";

// Middleware to authenticate any user (user or admin)
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    // Try user token first
    let decoded = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) throw new Error("User not found");
      req.isAdmin = false;
      return next();
    } catch (e) {
      // Try admin token if user token fails
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select("-password");
      if (!req.admin) throw new Error("Admin not found");
      req.isAdmin = true;
      return next();
    }
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware to allow only admins
export const requireAdmin = (req, res, next) => {
  if (!req.isAdmin || !req.admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Middleware to allow only users
export const requireUser = (req, res, next) => {
  if (req.isAdmin || !req.user) {
    return res.status(403).json({ error: "User access required" });
  }
  next();
};
