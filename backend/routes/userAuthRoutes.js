import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  validateResetToken,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
  testEmail,
} from "../controllers/userControllers/authController.js";
import { authenticate, requireUser } from "../middleware/auth.js";
import verifyRecaptcha from "../middleware/recaptchaMiddleware.js";

const userAuthRouter = express.Router();

// Test route to check if server is responding
userAuthRouter.get("/test", (req, res) => {
  console.log("🧪 Test route hit!");
  res.json({ message: "Auth routes are working!" });
});

// User authentication routes

userAuthRouter.post(
  "/register",
  (req, res, next) => {
    console.log("🚀 Register route hit!");
    console.log("📝 Request method:", req.method);
    console.log("🌐 Request URL:", req.url);
    console.log("📦 Request body keys:", Object.keys(req.body));
    next();
  },
  verifyRecaptcha,
  register
);
userAuthRouter.post(
  "/login",
  (req, res, next) => {
    console.log("🚀 Login route hit!");
    console.log("📝 Request method:", req.method);
    console.log("🌐 Request URL:", req.url);
    console.log("📦 Request body keys:", Object.keys(req.body));
    next();
  },
  login
);

userAuthRouter.get("/me", authenticate, requireUser, getMe);
userAuthRouter.post("/logout", logout);

// Password reset routes
userAuthRouter.post("/forgot-password", forgotPassword);
userAuthRouter.get("/validate-reset-token/:token", validateResetToken);
userAuthRouter.post("/reset-password/:token", resetPassword);

// Email verification routes
userAuthRouter.get("/verify-email/:token", verifyEmail);
userAuthRouter.post("/resend-verification", resendVerificationEmail);

userAuthRouter.post(
  "/change-password",
  authenticate,
  requireUser,
  changePassword
);

// Test route
userAuthRouter.post("/test-email", testEmail);

export default userAuthRouter;
