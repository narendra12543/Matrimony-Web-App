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
  testEmail
} from "../controllers/authController.js";
import { authenticate, requireUser } from "../middleware/auth.js";

const userAuthRouter = express.Router();

// User authentication routes
userAuthRouter.post("/register", register);
userAuthRouter.post("/login", login);
userAuthRouter.get("/me", authenticate, requireUser, getMe);
userAuthRouter.post("/logout", logout);

// Password reset routes
userAuthRouter.post("/forgot-password", forgotPassword);
userAuthRouter.get("/validate-reset-token/:token", validateResetToken);
userAuthRouter.post("/reset-password/:token", resetPassword);

// Email verification routes
userAuthRouter.get("/verify-email/:token", verifyEmail);
userAuthRouter.post("/resend-verification", resendVerificationEmail);

// Test route
userAuthRouter.post("/test-email", testEmail);

export default userAuthRouter;
