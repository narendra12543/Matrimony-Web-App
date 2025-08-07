import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Try finding by email (in case user signed up with email before)
          user = await User.findOne({ email: profile.emails[0].value });
        }
        if (!user) {
          const trialStartDate = new Date();
          const trialEndDate = new Date();
          trialEndDate.setDate(trialStartDate.getDate() + 3); // 3 days free trial

          const firstName =
            profile.name?.givenName || profile.displayName || "Unknown";
          const lastName = profile.name?.familyName || "";

          user = await User.create({
            firstName,
            lastName,
            email: profile.emails[0].value,
            googleId: profile.id,
            socialMediaLogin: true,
            isVerified: true,
            password: null,
            isNewUser: true, // Explicitly set isNewUser to true
            approvalStatus: "pending", // Explicitly set approvalStatus to pending
            trial: {
              startDate: trialStartDate,
              endDate: trialEndDate,
              isActive: true,
            },
          });
        } else if (!user.googleId) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.socialMediaLogin = true;
          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
