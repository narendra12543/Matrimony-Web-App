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
          user = await User.create({
            firstName: profile.name.givenName || "",
            lastName: profile.name.familyName || "",
            email: profile.emails[0].value,
            googleId: profile.id,
            socialMediaLogin: true,
            isVerified: true,
            password: null,
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
