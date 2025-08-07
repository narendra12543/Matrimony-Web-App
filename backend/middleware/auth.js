import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

const JWT_SECRET = process.env.JWT_SECRET || "yoursecret";
const ADMIN_JWT_SECRET = process.env.JWT_SECRET || "yoursecret";

// Middleware to authenticate any user (user or admin)
export const authenticate = async (req, res, next) => {
  console.log("🔐 Authentication middleware called");
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ No authorization header or invalid format");
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  console.log("🔑 Token received:", token ? "Token exists" : "No token");
  console.log(
    "🔑 Token starts with:",
    token ? token.substring(0, 20) + "..." : "No token"
  );

  try {
    // Try user token first
    let decoded = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log("✅ User token verified, decoded ID:", decoded.id);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) throw new Error("User not found");
      // Block suspended users from accessing protected routes
      if (req.user.accountStatus === "suspended") {
        return res.status(403).json({
          error: "Your account has been disabled by admin. Please contact support for more details.",
          accountDisabled: true,
        });
      }
      console.log("✅ User found in database:", req.user._id);
      req.isAdmin = false;
      return next();
    } catch (e) {
      console.log("❌ User token verification failed:", e.message);
      // Try admin token if user token fails
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
      console.log("✅ Admin token verified, decoded ID:", decoded.id);
      // console.log("Decoded admin token:", decoded);
      req.admin = await Admin.findById(decoded.id).select("-password");
      console.log("Admin found:", req.admin);
      if (!req.admin) throw new Error("Admin not found");
      req.isAdmin = true;
      return next();
    }
  } catch (err) {
    console.error("❌ Authentication error:", err.message);
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
  console.log("👤 requireUser middleware called");
  console.log("🔑 req.isAdmin:", req.isAdmin);
  console.log("👤 req.user exists:", req.user ? "Yes" : "No");

  if (req.isAdmin || !req.user) {
    console.log(
      "❌ Access denied - isAdmin:",
      req.isAdmin,
      "user exists:",
      req.user ? "Yes" : "No"
    );
    return res.status(403).json({ error: "User access required" });
  }
  console.log("✅ User access granted");
  next();
};
