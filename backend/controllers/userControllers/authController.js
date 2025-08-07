import User from "../../models/User.js";
import { registerUser, loginUser } from "../../services/authService.js";
import logger from "../../utils/logger.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
} from "../../services/emailService.js";
import { createNotification } from "../../services/notificationService.js";
import { notifyNewUserRegistration } from "../../services/adminNotificationService.js";
import { assignUniqueIdToUser } from "../../services/idGeneratorService.js";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "yoursecret";
console.log(JWT_SECRET);

const JWT_EXPIRES_IN = "7d";

// Function to verify reCAPTCHA token
const verifyRecaptcha = async (token) => {
  try {
    console.log(
      "🔍 Verifying reCAPTCHA token:",
      token ? "Token received" : "No token"
    );
    console.log(
      "🔑 Using secret key:",
      process.env.RECAPTCHA_SECRET_KEY ? "Secret key set" : "No secret key"
    );
    console.log(
      "🔑 Secret key (first 10 chars):",
      process.env.RECAPTCHA_SECRET_KEY
        ? process.env.RECAPTCHA_SECRET_KEY.substring(0, 10) + "..."
        : "No secret key"
    );

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      }
    );

    const data = await response.json();
    console.log("📡 Google reCAPTCHA response:", data);
    console.log("🔍 Success:", data.success);
    console.log("⚠️ Error codes:", data["error-codes"] || "None");

    return data.success;
  } catch (error) {
    console.error("❌ reCAPTCHA verification error:", error.message);
    return false;
  }
};

// Register new user
export const register = async (req, res) => {
  try {
    console.log("🚀 REGISTER FUNCTION CALLED - Real user registration started");
    console.log("🚀 Request body:", req.body);

    const { recaptchaToken, ...userData } = req.body;

    console.log("🔐 Registration attempt for:", userData.email);
    console.log("📝 Request body keys:", Object.keys(req.body));
    console.log("🔍 reCAPTCHA token present:", !!recaptchaToken);

    const {
      userData: newUser,
      token,
      emailVerificationToken,
    } = await registerUser(userData);

    // Initialize free trial for new users
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialStartDate.getDate() + 3); // 3 days free trial

    newUser.trial = {
      startDate: trialStartDate,
      endDate: trialEndDate,
      isActive: true,
    };
    newUser.isNewUser = true; // Explicitly set isNewUser to true
    newUser.approvalStatus = "pending"; // Explicitly set approvalStatus to pending
    await newUser.save();

    // Assign unique ID to user
    await assignUniqueIdToUser(newUser._id);

    logger.info(`User registered: ${req.body.email}`);

    // Create a welcome notification
    await createNotification({
      user: newUser._id,
      type: "welcome",
      title: "Welcome to ESMatrimonial!",
      message: `Hi ${newUser.firstName}, welcome to our platform! We're excited to have you here.`,
      link: "/profile",
    });

    // Send notification to user about pending approval
    await createNotification({
      user: newUser._id,
      type: "profile_pending",
      title: "Account Pending Approval",
      message:
        "Your account registration has been submitted for admin approval. You will be notified once your account is approved.",
      link: "/profile",
    });

    // Send admin notification for new user registration
    try {
      console.log(
        "🔔 Attempting to send admin notification for new user:",
        newUser.email
      );
      console.log("🔔 User data being sent:", {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      });

      await notifyNewUserRegistration({
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      });
      console.log(
        "✅ Admin notification sent successfully for new user:",
        newUser.email
      );
      logger.info(`Admin notification sent for new user: ${newUser.email}`);
    } catch (adminNotificationError) {
      console.error(
        "❌ Error sending admin notification:",
        adminNotificationError
      );
      console.error("❌ Error stack:", adminNotificationError.stack);
      console.error("❌ Error message:", adminNotificationError.message);
      console.error("❌ Error name:", adminNotificationError.name);
      logger.error(
        `Failed to send admin notification for new user: ${adminNotificationError.message}`
      );
      // Don't fail the entire registration if admin notification fails
      console.log(
        "⚠️ Continuing with registration despite admin notification error"
      );
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(newUser.email, newUser.firstName);
      logger.info(`Welcome email sent to ${newUser.email}`);
    } catch (emailError) {
      logger.error(
        `Failed to send welcome email to ${newUser.email}: ${emailError.message}`
      );
    }

    // Send verification email with backend HTML page URL
    try {
      const serverUrl = process.env.SERVER_URL;
      const verificationUrl = `${serverUrl}/verify-email/${emailVerificationToken}`;
      await sendVerificationEmail(
        newUser.email,
        emailVerificationToken,
        verificationUrl
      );
      logger.info(`Verification email sent to ${newUser.email}`);
    } catch (emailError) {
      logger.error(
        `Failed to send verification email to ${newUser.email}: ${emailError.message}`
      );
    }

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification. You must verify your email before logging in.",
      user: {
        ...newUser.toObject(),
        isNewUser: true,
        subscriberId: newUser.subscriberId,
      }, // <-- Ensure subscriberId is included
      token,
    });

    console.log(
      "✅ REGISTER FUNCTION COMPLETED - Real user registration finished successfully"
    );
  } catch (err) {
    console.error("❌ REGISTER FUNCTION ERROR:", err);
    logger.error(`Registration failed for ${req.body.email}: ${err.message}`);
    res.status(400).json({ error: err.message || "Server error" });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    console.log("🔐 Login attempt for:", email);
    console.log("📝 Request body:", {
      email,
      password: password ? "Password provided" : "No password",
      recaptchaToken: recaptchaToken ? "Token provided" : "No token",
    });

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      console.log("❌ No reCAPTCHA token provided");
      return res.status(400).json({ error: "reCAPTCHA verification required" });
    }

    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    console.log("✅ reCAPTCHA validation result:", isRecaptchaValid);

    if (!isRecaptchaValid) {
      console.log("❌ reCAPTCHA verification failed");
      return res.status(400).json({
        error: "reCAPTCHA verification failed. Please try again.",
        recaptchaError: true,
      });
    }

    // Find user and check if email is verified
    const user = await User.findOne({ email }).select("+password +uniqueId");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Block login if account is suspended
    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        error:
          "Your account has been disabled by admin. Please contact support for more details.",
        accountDisabled: true,
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        error:
          "Please verify your email before logging in. Check your inbox for verification email.",
        needsVerification: true,
        email: user.email,
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    logger.info(`User login: ${email}`);
    res.json({
      token,
      user: {
        ...user.toObject(),
        password: undefined,
        subscriberId: user.subscriberId,
      }, // <-- Ensure subscriberId is included
    });
  } catch (err) {
    logger.warn(`Login failed for ${req.body.email}: ${err.message}`);
    res.status(401).json({ error: err.message || "Invalid credentials" });
  }
};

// Get current user profile (requires auth middleware)
export const getMe = async (req, res) => {
  try {
    console.log("🔍 getMe - req.user:", req.user);
    console.log("🔍 getMe - req.user._id:", req.user._id);

    const user = await User.findById(
      req.user._id,
      "-password -verificationDocuments"
    )
      .select("+uniqueId")
      .populate("subscription.plan");

    console.log("🔍 getMe - Found user:", user);
    console.log("🔍 getMe - User subscriberId:", user?.subscriberId);

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    logger.error(`Error in getMe: ${err.message}`, { stack: err.stack });
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
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send email with backend HTML page URL
    const serverUrl = process.env.SERVER_URL;
    const resetUrl = `${serverUrl}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, resetToken, resetUrl);

    logger.info(`Password reset email sent to ${email}`);
    res.json({
      message: "Password reset email sent. Please check your inbox.",
      email: user.email,
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
    if (!token)
      return res
        .status(400)
        .json({ valid: false, message: "Token is required" });

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        valid: false,
        message: "Invalid or expired reset token",
      });
    }

    res.json({
      valid: true,
      message: "Token is valid",
      email: user.email,
    });
  } catch (err) {
    logger.error(`Token validation error: ${err.message}`);
    res.status(500).json({
      valid: false,
      message: "Failed to validate token",
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
        error: "Token and password required",
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Create a password change notification
    logger.info(
      `Creating password change notification for user: ${user.email}`
    );
    await createNotification({
      user: user._id,
      type: "password_change",
      title: "Password Changed",
      message: "Your password has been successfully changed.",
      link: "/settings", // Or a relevant link
    });

    logger.info(`Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
};

// Verify email (backend only - no frontend redirect)
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token)
      return res.status(400).json({ error: "Verification token required" });

    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const user = await User.findOne({
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired verification token",
        message:
          "The verification link is invalid or has expired. Please request a new verification email.",
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
      message:
        "Email verified successfully! You can now login to your account.",
      loginUrl: `${process.env.CLIENT_URL || "http://rmtjob.com"}/login`,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    logger.error(`Email verification error: ${err.message}`);
    res.status(500).json({
      error: "Failed to verify email",
      message: "An error occurred during verification. Please try again.",
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
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    user.emailVerificationToken = verificationTokenHash;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send new verification email
    const serverUrl = process.env.SERVER_URL;
    const verificationUrl = `${serverUrl}/verify-email/${verificationToken}`;
    await sendVerificationEmail(user.email, verificationToken, verificationUrl);

    logger.info(`Verification email resent to ${email}`);
    res.json({
      message: "Verification email sent successfully. Please check your inbox.",
      email: user.email,
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
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`Test email error: ${err.message}`);
    res.status(500).json({
      error: "Failed to send test email",
      details: err.message,
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await createNotification({
      user: user._id,
      type: "password_change",
      title: "Password Changed",
      message: "Your password has been successfully changed from settings.",
      link: "/settings",
    });

    logger.info(`Password changed for user: ${user.email}`);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    logger.error(`Change password error: ${err.message}`);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// Authentication logic
