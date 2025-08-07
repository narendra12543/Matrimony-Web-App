import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import "../config/passport.js";
import { createNotification } from "../services/notificationService.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { notifyNewUserRegistration } from "../services/adminNotificationService.js";
import Subscriber from "../models/Subscriber.js";
import User from "../models/User.js";

const googleRouter = express.Router();

googleRouter.get(
  "/google",
  (req, res, next) => {
    console.log("🔐 Google OAuth initiated");
    console.log("📝 Query params:", req.query);
    console.log("🌐 Environment check:", {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Missing",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
        ? "Set"
        : "Missing",
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "Not set",
    });
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

googleRouter.get(
  "/google/callback",
  (req, res, next) => {
    console.log("🔄 Google OAuth callback received");
    console.log("📝 Callback query params:", req.query);
    console.log("🔗 Full callback URL:", req.originalUrl);
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: (req, res) => {
      console.log("❌ Google OAuth failed");
      const redirectUrl =
        req.query.redirect || process.env.CLIENT_URL + "/login";
      const errorUrl = `${redirectUrl}?error=oauth_failed`;
      console.log("🔄 Redirecting to error URL:", errorUrl);
      res.redirect(errorUrl);
    },
  }),
  async (req, res) => {
    try {
      console.log("✅ Google OAuth successful, user:", req.user);

      if (!req.user) {
        console.error("❌ No user object found after authentication");
        const redirectUrl =
          req.query.redirect || process.env.CLIENT_URL + "/login";
        const errorUrl = `${redirectUrl}?error=no_user`;
        return res.redirect(errorUrl);
      }

      // Ensure a Subscriber exists and is linked to the user
      let user = req.user;
      console.log("🔍 Google OAuth - User object:", user);
      console.log("🔍 Google OAuth - User subscriberId:", user.subscriberId);
      
      if (!user.subscriberId) {
        console.log("🔍 Google OAuth - No subscriberId found, creating one...");
        // Try to find an existing subscriber by email
        let subscriber = await Subscriber.findOne({ email: user.email });
        if (!subscriber) {
          console.log("🔍 Google OAuth - Creating new subscriber for:", user.email);
          subscriber = new Subscriber({
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.email,
            email: user.email,
            // ...add other fields if needed
          });
          await subscriber.save();
          console.log("🔍 Google OAuth - Created subscriber:", subscriber._id);
        } else {
          console.log("🔍 Google OAuth - Found existing subscriber:", subscriber._id);
        }
        user.subscriberId = subscriber._id;
        await User.findByIdAndUpdate(user._id, {
          subscriberId: subscriber._id,
        });
        console.log("🔍 Google OAuth - Updated user with subscriberId:", subscriber._id);
      } else {
        console.log("🔍 Google OAuth - User already has subscriberId:", user.subscriberId);
      }

      // Block Google login if account is suspended
      if (user.accountStatus === "suspended") {
        const redirectUrl =
          req.query.redirect || process.env.CLIENT_URL + "/login";
        const errorUrl = `${redirectUrl}?error=account_disabled&message=${encodeURIComponent(
          "Your account has been disabled by admin. Please contact support for more details."
        )}`;
        return res.redirect(errorUrl);
      }

      // Issue JWT and redirect or respond with token
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscriberId: user.subscriberId, // <-- Include subscriberId in token if needed
        },
        process.env.JWT_SECRET || "yoursecret",
        { expiresIn: "7d" }
      );

      // Get redirect URL from query params or default to frontend
      const redirectUrl =
        req.query.redirect || process.env.CLIENT_URL + "/login";
      const successUrl = `${redirectUrl}?token=${token}&success=true`;

      console.log("✅ Google OAuth successful, redirecting with token");
      console.log("🔄 Success URL:", successUrl);

      // Check if the user is new
      const isNewUser = user.isNewUser;

      if (isNewUser) {
        // Send welcome notification
        await createNotification({
          user: user._id,
          type: "welcome",
          title: "Welcome to ESMatrimonial!",
          message: `Hi ${user.firstName}, welcome to our platform! We're excited to have you here.`,
          link: "/profile",
        });

        // Send notification to user about pending approval
        await createNotification({
          user: user._id,
          type: "profile_pending",
          title: "Account Pending Approval",
          message:
            "Your account registration has been submitted for admin approval. You will be notified once your account is approved.",
          link: "/profile",
        });

        // Send admin notification for new user registration
        try {
          console.log(
            "🔔 Attempting to send admin notification for new Google user:",
            user.email
          );
          console.log("🔔 User data being sent:", {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          });

          await notifyNewUserRegistration({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          });
          console.log(
            "✅ Admin notification sent successfully for new Google user:",
            user.email
          );
        } catch (adminNotificationError) {
          console.error(
            "❌ Error sending admin notification for Google user:",
            adminNotificationError
          );
          console.error("❌ Error stack:", adminNotificationError.stack);
          console.error("❌ Error message:", adminNotificationError.message);
          console.error("❌ Error name:", adminNotificationError.name);
          // Don't fail the entire OAuth flow if admin notification fails
          console.log(
            "⚠️ Continuing with OAuth flow despite admin notification error"
          );
        }

        // Send welcome email
        try {
          await sendWelcomeEmail(user.email, user.firstName);
        } catch (emailError) {
          console.error(
            "Failed to send welcome email to Google user:",
            emailError
          );
        }
      }

      res.redirect(successUrl);
    } catch (error) {
      console.error("❌ Error in Google OAuth callback:", error);
      const redirectUrl =
        req.query.redirect || process.env.CLIENT_URL + "/login";
      const errorUrl = `${redirectUrl}?error=oauth_failed&message=${encodeURIComponent(
        error.message
      )}`;
      res.redirect(errorUrl);
    }
  }
);

export default googleRouter;
