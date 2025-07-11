import {
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
} from "../services/userService.js";
import { getDailyRecommendations } from "../services/matchService.js";
import { getTodayRecommendation } from "../services/schedulerService.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// Get all users (with filters)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({},"-password -verificationDocuments" );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get single user profile
export const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    if (!user) {
      logger.warn(`User not found: ${req.params.id}`);
      return res.status(404).json({ error: "User not found" });
    }
    // Increment profileViews if the requester is not the owner
    if (req.user && req.user._id && req.user._id.toString() !== user._id.toString()) {
      await User.findByIdAndUpdate(user._id, { $inc: { profileViews: 1 } });
      user.profileViews = user.profileViews + 1;
    }
    logger.info(`Fetched user: ${req.params.id}`);
    res.json(user);
  } catch (err) {
    logger.error(`Error fetching user ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user profile
export const updateUser = async (req, res) => {
  try {
    const user = await updateUserService(req.params.id, req.body);
    if (!user) {
      logger.warn(`User not found for update: ${req.params.id}`);
      return res.status(404).json({ error: "User not found" });
    }
    logger.info(`Updated user: ${req.params.id}`);
    res.json(user);
  } catch (err) {
    logger.error(`Error updating user ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete user account
export const deleteUser = async (req, res) => {
  try {
    const user = await deleteUserService(req.params.id);
    if (!user) {
      logger.warn(`User not found for deletion: ${req.params.id}`);
      return res.status(404).json({ error: "User not found" });
    }
    logger.info(`Deleted user: ${req.params.id}`);
    res.json({ message: "User deleted" });
  } catch (err) {
    logger.error(`Error deleting user ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

// Upload profile photo (stub)
export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No photo uploaded" });
    }
    const userId = req.user._id;
    const photoUrl = req.file.path;
    // Add photo URL to user's photos array
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { photos: photoUrl } },
      { new: true }
    );
    res.json({ message: "Photo uploaded", photoUrl, photos: user.photos });
  } catch (err) {
    res.status(500).json({ error: "Photo upload failed" });
  }
};

// Upload verification documents (stub)
export const uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No documents uploaded" });
    }
    const userId = req.user._id;
    const docUrls = req.files.map(f => f.path);
    // Add document URLs to user's verificationDocuments array (create if not exists)
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { verificationDocuments: { $each: docUrls } } },
      { new: true }
    );
    res.json({ message: "Documents uploaded", docUrls, verificationDocuments: user.verificationDocuments });
  } catch (err) {
    res.status(500).json({ error: "Document upload failed" });
  }
};

// Get match suggestions (stub)
export const getSuggestions = async (req, res) => {
  logger.info(
    `Match suggestions requested for user: ${req.user?.id || "unknown"}`
  );
  res.json([]);
};

// Search users with filters (stub)
export const searchUsers = async (req, res) => {
  logger.info("User search requested with filters", req.body);
  res.json([]);
};

// Calculate profile completion percentage
export const getProfileCompletion = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    if (!user) {
      logger.warn(`User not found for profile completion: ${req.params.id}`);
      return res.status(404).json({ error: "User not found" });
    }

    const fields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "height",
      "weight",
      "maritalStatus",
      "religion",
      "caste",
      "motherTongue",
      "manglik",
      "bodyType",
      "complexion",
      "physicalStatus",
      "email",
      "phone",
      "country",
      "state",
      "city",
      "residentialStatus",
      "education",
      "educationDetails",
      "occupation",
      "occupationDetails",
      "annualIncome",
      "workLocation",
      "familyType",
      "familyStatus",
      "familyValues",
      "fatherOccupation",
      "motherOccupation",
      "siblings",
      "familyLocation",
      "diet",
      "smoking",
      "drinking",
      "hobbies",
      "interests",
      "aboutMe",
      "partnerAgeMin",
      "partnerAgeMax",
      "partnerHeightMin",
      "partnerHeightMax",
      "partnerEducation",
      "partnerOccupation",
      "partnerIncome",
      "partnerLocation",
      "partnerReligion",
      "partnerCaste",
      "partnerMaritalStatus",
      "partnerAbout",
      "photos",
    ];

    let filled = 0;
    let missingFields = [];

    fields.forEach((field) => {
      if (Array.isArray(user[field])) {
        if (user[field] && user[field].length > 0) {
          filled++;
        } else {
          missingFields.push(field);
        }
      } else if (
        user[field] !== undefined &&
        user[field] !== null &&
        user[field] !== ""
      ) {
        filled++;
      } else {
        missingFields.push(field);
      }
    });

    // Add isVerified as a required field for 100%
    const totalFields = fields.length + 1;
    if (user.isVerified) {
      filled++;
    } else {
      missingFields.push("isVerified");
    }

    const percentage = Math.round((filled / totalFields) * 100);

    logger.info(
      `Profile completion for user ${
        req.params.id
      }: ${percentage}%, missing: ${missingFields.join(", ")}`
    );
    res.json({ completion: percentage, missingFields });
  } catch (err) {
    logger.error(
      `Error calculating profile completion for ${req.params.id}: ${err.message}`
    );
    res.status(500).json({ error: "Server error" });
  }
};

// Get daily recommendation
export const getDailyRecommendation = async (req, res) => {
  try {
    const userId = req.user._id;
    logger.info(`Fetching daily recommendation for user: ${userId}`);

    // First try to get today's pre-generated recommendation
    let todayRecommendation = await getTodayRecommendation(userId);

    if (!todayRecommendation) {
      logger.info(
        `No pre-generated recommendation found for user ${userId}, generating on-demand`
      );

      // Fallback to on-demand generation
      const recommendations = await getDailyRecommendations(userId, 1);

      if (!recommendations.length) {
        logger.warn(`No recommendations found for user: ${userId}`);
        return res.status(404).json({
          message: "No recommendations found. Try adjusting your preferences.",
          suggestion: "Complete your profile for better matches",
        });
      }

      // Return the on-demand recommendation
      logger.info(
        `Successfully generated on-demand recommendation for user ${userId}`
      );
      return res.json({
        recommendation: recommendations[0],
        matchPercentage: calculateMatchPercentage(recommendations[0].matchScore),
        isOnDemand: true,
      });
    }

    // Mark as viewed
    await todayRecommendation.updateOne({ isViewed: true });

    logger.info(`Successfully retrieved pre-generated recommendation for user ${userId}`);
    res.json({
      recommendation: todayRecommendation.recommendedUserId,
      matchPercentage: todayRecommendation.matchPercentage,
      isOnDemand: false,
      recommendationId: todayRecommendation._id,
    });
  } catch (err) {
    logger.error(
      `Recommendation error for user ${req.user._id}: ${err.message}`
    );
    res.status(500).json({
      error: "Failed to generate recommendations",
      details: err.message,
    });
  }
};

// Skip recommendation
export const skipRecommendation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skippedUserId, recommendationId } = req.body;

    // Add to skipped users list
    await User.findByIdAndUpdate(userId, {
      $addToSet: { skippedUsers: skippedUserId },
    });

    // If we have a recommendationId, mark it as skipped
    if (recommendationId) {
      const DailyRecommendation = (await import("../models/DailyRecommendation.js"))
        .default;
      await DailyRecommendation.findByIdAndUpdate(recommendationId, {
        isSkipped: true,
      });
    }

    res.json({ message: "User skipped successfully" });
  } catch (err) {
    logger.error(`Error skipping user: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

// Like recommendation
export const likeRecommendation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { recommendedUserId, recommendationId } = req.body;

    // If we have a recommendationId, mark it as liked
    if (recommendationId) {
      const DailyRecommendation = (await import("../models/DailyRecommendation.js"))
        .default;
      await DailyRecommendation.findByIdAndUpdate(recommendationId, {
        isLiked: true,
      });
    }

    // Here you could add logic to send a connection request
    // For now, we'll just log the like action

    logger.info(`User ${userId} liked recommendation ${recommendedUserId}`);
    res.json({ message: "Recommendation liked successfully" });
  } catch (err) {
    logger.error(`Error liking recommendation: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

// Helper function
const calculateMatchPercentage = (score) => {
  const maxPossibleScore = 10; // Adjust based on your scoring system
  return Math.min(100, Math.round((score / maxPossibleScore) * 100));
};
