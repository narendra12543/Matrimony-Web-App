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
  uploadDocuments
} from "../controllers/userController.js";
import { uploadFile } from "../config/cloudinary.js";
import express from "express";
import { authenticate, requireUser } from "../middleware/auth.js";
const userRouter = express.Router();

userRouter.get(
  "/daily-recommendation",
  authenticate,
  requireUser,
  getDailyRecommendation
);
userRouter.get("/profile-completion/:id", getProfileCompletion);
userRouter.get("/:id", getUserById);
userRouter.get("/", getAllUsers);
userRouter.put("/:id", authenticate, requireUser, updateUser);
userRouter.post("/skip", authenticate, requireUser, skipRecommendation);
userRouter.post("/like", authenticate, requireUser, likeRecommendation);
userRouter.post("/upload-photo", authenticate, requireUser, uploadFile.single('photo'), uploadPhoto);
userRouter.post("/upload-docs", authenticate, requireUser, uploadFile.array('docs', 5), uploadDocuments);

export default userRouter;
