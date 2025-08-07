// User profile routes
import {
  getAllUsers,
  getUserById,
  getProfileCompletion,
  getDailyRecommendation,
  skipRecommendation,
  likeRecommendation,
  updateUser, // Add this import
  uploadPhoto,
  uploadDocuments,
  searchUsers,
  updateIsNewUser,
  updatePrivacySettings,
  deleteAccount,
  deletePhoto,
  updateEssentialProfile,
  getUserPreferences,
  updateUserPreferences,
} from "../controllers/userController.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local storage configuration for user routes
const uploadFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads/temp'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});
import express from "express";
import { authenticate, requireUser } from "../middleware/auth.js";
import Subscriber from "../models/Subscriber.js";
import User from "../models/User.js";
const userRouter = express.Router();

userRouter.get(
  "/daily-recommendation",
  authenticate,
  requireUser,
  getDailyRecommendation
);
userRouter.get("/profile-completion/:id", getProfileCompletion);
userRouter.get("/search", authenticate, searchUsers);
userRouter.get("/:id", getUserById);
userRouter.get("/", getAllUsers);
userRouter.put(
  "/update-is-new-user",
  authenticate,
  requireUser,
  updateIsNewUser
);
userRouter.put(
  "/essential-profile",
  authenticate,
  requireUser,
  updateEssentialProfile
);
userRouter.put(
  "/privacy-settings",
  authenticate,
  requireUser,
  updatePrivacySettings
);
userRouter.put("/:id", authenticate, requireUser, updateUser);
userRouter.post("/skip", authenticate, requireUser, skipRecommendation);
userRouter.post("/like", authenticate, requireUser, likeRecommendation);
userRouter.post(
  "/upload-photo",
  authenticate,
  requireUser,
  uploadFile.single("photo"),
  uploadPhoto
);
userRouter.post(
  "/upload-docs",
  authenticate,
  requireUser,
  uploadFile.array("docs", 5),
  uploadDocuments
);
userRouter.delete("/photo", authenticate, requireUser, deletePhoto);
userRouter.delete("/delete-account", authenticate, requireUser, deleteAccount);

// Create subscriber for user
userRouter.post(
  "/create-subscriber",
  authenticate,
  requireUser,
  async (req, res) => {
    try {
      const { name, email } = req.body;
      const userId = req.user._id;

      // Check if subscriber already exists
      let subscriber = await Subscriber.findOne({ email });
      if (!subscriber) {
        subscriber = new Subscriber({
          name: name || email,
          email: email,
          status: "active",
        });
        await subscriber.save();
      }

      // Update user with subscriberId
      await User.findByIdAndUpdate(userId, {
        subscriberId: subscriber._id,
      });

      res.json({
        success: true,
        subscriber: subscriber,
        message: "Subscriber created and linked to user",
      });
    } catch (error) {
      console.error("Error creating subscriber:", error);
      res.status(500).json({ error: "Failed to create subscriber" });
    }
  }
);

// Partner Preferences routes
userRouter.get(
  "/:id/preferences",
  authenticate,
  requireUser,
  getUserPreferences
);
userRouter.put(
  "/:id/preferences",
  authenticate,
  requireUser,
  updateUserPreferences
);

export default userRouter;
