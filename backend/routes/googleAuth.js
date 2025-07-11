import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import "../config/passport.js";

const googleRouter = express.Router();

googleRouter.get(
  "/google",
  (req, res, next) => {
    console.log('🔐 Google OAuth initiated');
    console.log('📝 Query params:', req.query);
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

googleRouter.get(
  "/google/callback",
  (req, res, next) => {
    console.log('🔄 Google OAuth callback received');
    console.log('📝 Callback query params:', req.query);
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: (req, res) => {
      console.log('❌ Google OAuth failed');
      const redirectUrl = req.query.redirect || "http://localhost:5173/login";
      const errorUrl = `${redirectUrl}?error=oauth_failed`;
      console.log('🔄 Redirecting to error URL:', errorUrl);
      res.redirect(errorUrl);
    },
  }),
  (req, res) => {
    try {
      console.log('✅ Google OAuth successful, user:', req.user);
      
      // Issue JWT and redirect or respond with token
      const token = jwt.sign(
        { 
          id: req.user._id, 
          email: req.user.email,
          name: req.user.name,
          picture: req.user.picture
        },
        process.env.JWT_SECRET || "yoursecret",
        { expiresIn: "7d" }
      );
      
      // Get redirect URL from query params or default to login
      const redirectUrl = req.query.redirect || "http://localhost:5173/login";
      const successUrl = `${redirectUrl}?token=${token}&success=true`;
      
      console.log('✅ Google OAuth successful, redirecting with token');
      console.log('🔄 Success URL:', successUrl);
      res.redirect(successUrl);
    } catch (error) {
      console.error('❌ Error in Google OAuth callback:', error);
      const redirectUrl = req.query.redirect || "http://localhost:5173/login";
      const errorUrl = `${redirectUrl}?error=oauth_failed`;
      res.redirect(errorUrl);
    }
  }
);

export default googleRouter;
