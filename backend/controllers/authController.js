import User from "../models/User.js";
import { registerUser, loginUser } from "../services/authService.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail } from "../services/emailService.js";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "yoursecret";
const JWT_EXPIRES_IN = "7d";

// Register new user
export const register = async (req, res) => {
  try {
    const { userData, token, emailVerificationToken } = await registerUser(req.body);
    logger.info(`User registered: ${req.body.email}`);
    
    // Send welcome email
    try {
      await sendWelcomeEmail(userData.email, userData.firstName);
      logger.info(`Welcome email sent to ${userData.email}`);
    } catch (emailError) {
      logger.error(`Failed to send welcome email to ${userData.email}: ${emailError.message}`);
    }
    
    // Send verification email with backend HTML page URL
    try {
      const verificationUrl = `${process.env.SERVER_URL || "http://localhost:5000"}/verify-email/${emailVerificationToken}`;
      await sendVerificationEmail(userData.email, emailVerificationToken, verificationUrl);
      logger.info(`Verification email sent to ${userData.email}`);
    } catch (emailError) {
      logger.error(`Failed to send verification email to ${userData.email}: ${emailError.message}`);
    }
    
    res
      .status(201)
      .json({ 
        message: "User registered successfully. Please check your email for verification. You must verify your email before logging in.", 
        user: userData, 
        token
      });
  } catch (err) {
    logger.error(`Registration failed for ${req.body.email}: ${err.message}`);
    res.status(400).json({ error: err.message || "Server error" });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and check if email is verified
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ 
        error: "Please verify your email before logging in. Check your inbox for verification email.",
        needsVerification: true,
        email: user.email
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Generate token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    logger.info(`User login: ${email}`);
    res.json({ 
      token, 
      user: { ...user.toObject(), password: undefined } 
    });
  } catch (err) {
    logger.warn(`Login failed for ${req.body.email}: ${err.message}`);
    res.status(401).json({ error: err.message || "Invalid credentials" });
  }
};

// Get current user profile (requires auth middleware)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.id,
      "-password -verificationDocuments"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Logout (stateless JWT, just a stub)
export const logout = (req, res) => {
  res.json({ message: "Logged out (client should delete token)" });
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();
    
    // Send email with backend HTML page URL
    const resetUrl = `${process.env.SERVER_URL || "http://localhost:5000"}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, resetToken, resetUrl);
    
    logger.info(`Password reset email sent to ${email}`);
    res.json({ 
      message: "Password reset email sent. Please check your inbox.",
      email: user.email
    });
  } catch (err) {
    logger.error(`Forgot password error: ${err.message}`);
    res.status(500).json({ error: "Failed to send password reset email" });
  }
};

// Validate reset token (for HTML page)
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ valid: false, message: "Token is required" });
    
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      return res.status(400).json({ 
        valid: false, 
        message: "Invalid or expired reset token" 
      });
    }
    
    res.json({ 
      valid: true, 
      message: "Token is valid",
      email: user.email 
    });
  } catch (err) {
    logger.error(`Token validation error: ${err.message}`);
    res.status(500).json({ 
      valid: false, 
      message: "Failed to validate token" 
    });
  }
};

// Reset password (updated for HTML page)
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Token and password required" 
      });
    }
    
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid or expired reset token" 
      });
    }
    
    // Hash new password
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    logger.info(`Password reset successful for user: ${user.email}`);
    
    res.json({ 
      success: true,
      message: "Password reset successful" 
    });
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).json({ 
      success: false,
      error: "Failed to reset password" 
    });
  }
};

// Verify email (backend only - no frontend redirect)
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: "Verification token required" });
    
    const verificationTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: "Invalid or expired verification token",
        message: "The verification link is invalid or has expired. Please request a new verification email."
      });
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    // If this is the first verification, also mark as verified
    if (!user.isVerified) {
      user.isVerified = true;
    }
    
    await user.save();
    
    logger.info(`Email verified for user: ${user.email}`);
    
    // Return success with login link
    res.json({ 
      success: true,
      message: "Email verified successfully! You can now login to your account.",
      loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
      user: { 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    logger.error(`Email verification error: ${err.message}`);
    res.status(500).json({ 
      error: "Failed to verify email",
      message: "An error occurred during verification. Please try again."
    });
  }
};

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    
    user.emailVerificationToken = verificationTokenHash;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();
    
    // Send new verification email
    const verificationUrl = `${process.env.SERVER_URL || "http://localhost:5000"}/verify-email/${verificationToken}`;
    await sendVerificationEmail(user.email, verificationToken, verificationUrl);
    
    logger.info(`Verification email resent to ${email}`);
    res.json({ 
      message: "Verification email sent successfully. Please check your inbox.",
      email: user.email
    });
  } catch (err) {
    logger.error(`Resend verification error: ${err.message}`);
    res.status(500).json({ error: "Failed to send verification email" });
  }
};

// Test email service
export const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    logger.info(`Testing email service for ${email}`);
    
    // Test welcome email
    await sendWelcomeEmail(email, "Test User");
    
    res.json({ 
      message: "Test email sent successfully",
      email: email,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error(`Test email error: ${err.message}`);
    res.status(500).json({ 
      error: "Failed to send test email",
      details: err.message 
    });
  }
};

// Authentication logic
