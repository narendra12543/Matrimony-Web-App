import {
  getAllUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
} from "../services/userService.js";
import { getDailyRecommendations } from "../services/matchService.js";

import User from "../models/User.js";
import DailyRecommendation from "../models/DailyRecommendation.js";
import logger from "../utils/logger.js";
import { createNotification } from "../services/notificationService.js";
import { notifySuspiciousActivity } from "../services/adminNotificationService.js";
import mongoose from "mongoose";

// Get all users (with filters)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      { approvalStatus: "approved" },
      "-password -pendingChanges"
    ).select("+uniqueId");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get single user profile
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("+uniqueId")
      .populate("subscription.plan");
    if (!user) {
      logger.warn(`User not found: ${req.params.id}`);
      return res.status(404).json({ error: "User not found" });
    }

    // Convert to object and exclude sensitive fields
    const userObject = user.toObject();
    delete userObject.password;

    // If the requester is the owner, merge pendingChanges into the response
    if (
      req.user &&
      req.user._id &&
      req.user._id.toString() === user._id.toString()
    ) {
      if (user.pendingChanges && Object.keys(user.pendingChanges).length > 0) {
        Object.assign(userObject, user.pendingChanges);
        userObject.hasPendingChanges = true;
      }
      logger.info(
        `Fetched own user profile (with pending changes): ${req.params.id}`
      );
      return res.json(userObject);
    }

    // --- PRIVACY ENFORCEMENT START ---
    // Only allow profile viewing if privacy settings allow
    const privacy = user.privacy || {};
    const profileVisibility = privacy.profileVisibility || "public";
    const contactVisibility = privacy.contactVisibility || "premium-only";

    // Get requester's subscription/verification status
    let requester = req.user;
    let isPremium = false;
    let isVerified = false;
    if (requester) {
      // If requester is a user, get their subscription/verification
      isPremium =
        requester.subscription &&
        requester.subscription.planName &&
        requester.subscription.planName.toLowerCase().includes("premium");
      isVerified = !!requester.isVerified;
    }

    // Profile visibility check
    if (profileVisibility === "premium-only" && !isPremium) {
      return res
        .status(403)
        .json({ error: "Profile visible to premium members only" });
    }
    if (profileVisibility === "verified-only" && !isVerified) {
      return res
        .status(403)
        .json({ error: "Profile visible to verified members only" });
    }

    // Remove contact info if not allowed
    let userObj = user.toObject();
    if (contactVisibility === "premium-only" && !isPremium) {
      userObj.phone = undefined;
      userObj.email = undefined;
    }
    if (contactVisibility === "verified-only" && !isVerified) {
      userObj.phone = undefined;
      userObj.email = undefined;
    }
    if (contactVisibility === "all") {
      // Optionally, only after connection - implement as needed
      // For now, allow all
    }
    // --- PRIVACY ENFORCEMENT END ---

    // For other users, do not show pendingChanges
    delete userObject.pendingChanges;
    logger.info(`Fetched user: ${req.params.id}`);
    res.json(userObject);
  } catch (err) {
    logger.error(`Error fetching user ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user profile
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { _id: requesterId, isAdmin } = req.user; // Assuming req.user is populated by authenticate middleware

    // Only the user themselves or an admin can update their profile
    if (userId !== requesterId.toString() && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own profile." });
    }

    const sensitiveFields = [
      "firstName",
      "lastName",
      "photos",
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
    ]; // Define sensitive fields

    // First, get the current user to access existing pendingChanges
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    let updates = {};
    let pendingChanges = { ...currentUser.pendingChanges }; // Start with existing pending changes
    let requiresApproval = false;

    for (const key in req.body) {
      if (sensitiveFields.includes(key)) {
        // For sensitive fields, add to pendingChanges
        pendingChanges[key] = req.body[key];
        requiresApproval = true;
      } else {
        // For non-sensitive fields, update immediately
        updates[key] = req.body[key];
      }
    }

    if (requiresApproval) {
      // Merge new pending changes with existing ones
      updates.pendingChanges = pendingChanges;
      updates.approvalStatus = "pending";

      // Send notification to user about pending approval
      await createNotification({
        user: userId,
        type: "profile_pending",
        title: "Profile Changes Pending Approval",
        message:
          "Your profile changes have been submitted for admin approval. Only your old data is visible to others until approved.",
        link: "/profile",
      });

      // Send admin notification for pending profile changes
      try {
        await notifySuspiciousActivity({
          userId: userId,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          userEmail: currentUser.email,
          activityType: "profile_changes_pending",
          description: "User profile changes require admin approval",
          severity: "medium",
          details: `User ${currentUser.firstName} ${currentUser.lastName} has updated sensitive profile fields that require admin approval.`,
        });
        logger.info(
          `Admin notification sent for pending profile changes: ${currentUser.email}`
        );
      } catch (adminNotificationError) {
        logger.error(
          `Failed to send admin notification for profile changes: ${adminNotificationError.message}`
        );
      }
    } else if (Object.keys(updates).length > 0) {
      // Send notification for immediate updates
      await createNotification({
        user: userId,
        type: "profile_updated",
        title: "Profile Updated",
        message:
          "Your profile has been updated successfully and is now visible to others.",
        link: "/profile",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates }, // Use $set to update fields
      { new: true, runValidators: true }
    ).select("-password -verificationDocuments"); // Exclude sensitive fields from response

    if (!updatedUser) {
      logger.warn(`User not found for update: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }

    logger.info(`Updated user: ${userId}`);
    res.json(updatedUser);
  } catch (err) {
    logger.error(`Error updating user ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};
export const updateIsNewUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't actually change isNewUser to false here
    // This should only happen after admin approval
    // Just acknowledge that the popup was dismissed
    res.json({
      message: "Welcome popup dismissed successfully",
      isNewUser: user.isNewUser, // Return current status
    });
  } catch (err) {
    logger.error(`Error updating isNewUser status: ${err.message}`);
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

// Upload profile photo
export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No photo uploaded" });
    }
    const userId = req.user._id;
    const photoUrl = req.file.path;

    // Fetch current user to get existing pendingChanges
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add the new photo to pendingChanges.photos
    const newPendingPhotos = [
      ...(currentUser.pendingChanges?.photos || []),
      photoUrl,
    ];

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "pendingChanges.photos": newPendingPhotos,
          approvalStatus: "pending",
        },
      },
      { new: true, runValidators: true }
    ).select("-password -verificationDocuments");

    // Send notification to user about pending photo approval
    await createNotification({
      user: userId,
      type: "photo_pending",
      title: "Photos Pending Approval",
      message:
        "Your new photos have been uploaded and are pending admin approval. Only your old photos are visible to others until approved.",
      link: "/profile",
    });

    res.json({
      message: "Photo uploaded for approval",
      photoUrl,
      pendingPhotos: updatedUser.pendingChanges?.photos || [],
      approvalStatus: updatedUser.approvalStatus,
    });
  } catch (err) {
    logger.error(
      `Error uploading photo for user ${req.user._id}: ${err.message}`
    );
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
    const docUrls = req.files.map((f) => f.path);
    // Add document URLs to user's verificationDocuments array (create if not exists)
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { verificationDocuments: { $each: docUrls } } },
      { new: true }
    );
    res.json({
      message: "Documents uploaded",
      docUrls,
      verificationDocuments: user.verificationDocuments,
    });
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
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Authentication required for search." });
    }
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Search query 'q' is required." });
    }

    const searchRegex = new RegExp(q, "i"); // Case-insensitive search

    const users = await User.find(
      {
        approvalStatus: "approved",
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { city: searchRegex },
          { state: searchRegex },
          { occupation: searchRegex },
          { education: searchRegex },
          { interests: searchRegex },
        ],
      },
      "firstName lastName city state occupation education photos"
    )
      .select("+uniqueId") // Select relevant fields
      .limit(20); // Limit results for suggestions

    logger.info(`User search for '${q}' returned ${users.length} results.`);
    res.json(users);
  } catch (err) {
    logger.error(
      `Error during user search for '${req.query.q}': ${err.message}`
    );
    res.status(500).json({ error: "Server error during search" });
  }
};

// Calculate profile completion percentage
export const getProfileCompletion = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
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
const publicUserFields =
  "firstName lastName photos dateOfBirth occupation city country height weight maritalStatus religion caste motherTongue manglik bodyType complexion physicalStatus email phone state residentialStatus education educationDetails annualIncome workLocation familyType familyStatus familyValues fatherOccupation motherOccupation siblings familyLocation diet smoking drinking hobbies interests aboutMe partnerAgeMin partnerAgeMax partnerHeightMin partnerHeightMax partnerEducation partnerOccupation partnerIncome partnerLocation partnerReligion partnerCaste partnerMaritalStatus partnerAbout lastActive";

// Get daily recommendation
export const getDailyRecommendation = async (req, res) => {
  try {
    const userId = req.user._id;
    logger.info(`Fetching daily recommendation for user: ${userId}`);

    // First try to get today's pre-generated recommendation
    const DailyRecommendation = (
      await import("../models/DailyRecommendation.js")
    ).default;
    let todayRecommendation = await DailyRecommendation.findOne({
      userId: userId,
      isViewed: false,
      isSkipped: false,
      isLiked: false,
    });

    if (todayRecommendation) {
      // Populate the recommendedUserId to get user details including avatar
      await todayRecommendation.populate("recommendedUserId", publicUserFields);
      logger.info(
        `Successfully retrieved pre-generated recommendation for user ${userId}`
      );
      // Mark as viewed
      await todayRecommendation.updateOne({ isViewed: true });
      return res.json({
        recommendation: todayRecommendation,
        matchPercentage: todayRecommendation.matchPercentage,
        isOnDemand: false,
        recommendationId: todayRecommendation._id,
      });
    }

    logger.info(
      `No pre-generated recommendation found for user ${userId}, generating on-demand`
    );

    // Fallback to on-demand generation
    const { profiles: recommendations } = await getDailyRecommendations(userId);

    if (!recommendations.length) {
      logger.warn(`No recommendations found for user: ${userId}`);
      return res.status(404).json({
        message:
          "No new recommendations found based on your current preferences.",
        suggestions: [
          "Try adjusting your partner preferences to broaden your search.",
          "Complete your profile to unlock more potential matches.",
          "Consider resetting your skipped users list to see them again (if you wish).",
          "Check back later, new users are joining all the time!",
        ],
      });
    }

    // Fetch the current user's skipped users to filter out
    const currentUser = await User.findById(userId)
      .select("skippedUsers")
      .lean();
    const skippedUserIds = new Set(
      currentUser.skippedUsers.map((id) => id.toString())
    );

    let nextRecommendation = null;
    for (const rec of recommendations) {
      if (!skippedUserIds.has(rec._id.toString())) {
        nextRecommendation = rec;
        break;
      }
    }

    if (!nextRecommendation) {
      logger.warn(
        `All generated recommendations were skipped for user: ${userId}`
      );
      return res.status(404).json({
        message:
          "No new recommendations found based on your current preferences. All available recommendations have been skipped.",
        suggestions: [
          "Try adjusting your partner preferences to broaden your search.",
          "Complete your profile to unlock more potential matches.",
          "Consider resetting your skipped users list to see them again (if you wish).",
          "Check back later, new users are joining all the time!",
        ],
      });
    }

    // Return the on-demand recommendation
    logger.info(
      `Successfully generated on-demand recommendation for user ${userId}`
    );

    // Manually select public fields for the on-demand recommendation
    const filteredRecommendedUser = {};
    publicUserFields.split(" ").forEach((field) => {
      if (nextRecommendation[field] !== undefined) {
        filteredRecommendedUser[field] = nextRecommendation[field];
      }
    });
    filteredRecommendedUser._id = nextRecommendation._id; // Ensure _id is always included

    const onDemandRecommendation = {
      recommendedUserId: filteredRecommendedUser,
      matchScore: nextRecommendation.matchScore,
      matchPercentage: calculateMatchPercentage(nextRecommendation.matchScore),
      isOnDemand: true,
    };
    return res.json({
      recommendation: onDemandRecommendation,
      matchPercentage: onDemandRecommendation.matchPercentage,
      isOnDemand: true,
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
      const DailyRecommendation = (
        await import("../models/DailyRecommendation.js")
      ).default;
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
      const DailyRecommendation = (
        await import("../models/DailyRecommendation.js")
      ).default;
      await DailyRecommendation.findByIdAndUpdate(recommendationId, {
        isLiked: true,
      });
    }

    // Here you could add logic to send a connection request
    // Create a notification for the recommended user
    const likingUser = await User.findById(userId);
    if (likingUser) {
      await createNotification({
        user: recommendedUserId,
        type: "new_interest",
        title: "New Interest!",
        message: `${likingUser.firstName} has shown interest in your profile!`, // Use liking user's name
        link: `/profile/${userId}`, // Link to the liking user's profile
      });
      logger.info(
        `Notification created for ${recommendedUserId} about interest from ${userId}`
      );
    }

    logger.info(`User ${userId} liked recommendation ${recommendedUserId}`);
    res.json({ message: "Recommendation liked successfully" });
  } catch (err) {
    logger.error(`Error liking recommendation: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

// Helper function
const calculateMatchPercentage = (score) => {
  const maxPossibleScore = 127; // Adjust based on your scoring system
  return Math.min(100, Math.round((score / maxPossibleScore) * 100));
};

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const {
      profileVisibility,
      contactVisibility,
      dataUsage,
      marketingCommunications,
    } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateObj },
      { new: true }
    );

    logger.info(`Privacy settings updated for user: ${updatedUser.email}`);
    console.log(
      "CONTROLLER INFO: Privacy settings updated for user:",
      updatedUser.email
    );
    res.json({
      message: "Privacy settings updated successfully",
      privacy: updatedUser.privacy,
    });
  } catch (err) {
    logger.error(`Privacy settings update error: ${err.message}`, err);
    console.log("CONTROLLER ERROR: Privacy settings update error:", err);
    res.status(500).json({ error: "Failed to update privacy settings" });
  }
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    logger.info(`Account deleted for user: ${user.email}`);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    logger.error(`Account deletion error: ${err.message}`);
    res.status(500).json({ error: "Failed to delete account" });
  }
};

// Delete a profile photo
export const deletePhoto = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: "No photo URL provided" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let updated = false;
    // Remove from pendingChanges.photos if present
    if (user.pendingChanges && Array.isArray(user.pendingChanges.photos)) {
      const newPendingPhotos = user.pendingChanges.photos.filter(
        (url) => url !== photoUrl
      );
      if (newPendingPhotos.length !== user.pendingChanges.photos.length) {
        user.pendingChanges.photos = newPendingPhotos;
        updated = true;
      }
    }
    // Remove from main photos if present (only if not in pendingChanges)
    if (!updated && Array.isArray(user.photos)) {
      const newPhotos = user.photos.filter((url) => url !== photoUrl);
      if (newPhotos.length !== user.photos.length) {
        user.photos = newPhotos;
        updated = true;
      }
    }
    if (updated) {
      await user.save();

      // Also delete the actual file from server
      try {
        const { deleteFile } = await import(
          "../services/fileStorageService.js"
        );
        await deleteFile(photoUrl);
        logger.info(`Photo file deleted successfully: ${photoUrl}`);
      } catch (fileError) {
        logger.warn(`Failed to delete photo file: ${photoUrl}`, fileError);
        // Don't fail the entire operation if file deletion fails
      }

      // Return merged profile if owner
      const mergedUser = user.toObject();
      if (user.pendingChanges && Object.keys(user.pendingChanges).length > 0) {
        Object.assign(mergedUser, user.pendingChanges);
        mergedUser.hasPendingChanges = true;
      }
      return res.json({ message: "Photo deleted", user: mergedUser });
    } else {
      return res.status(400).json({ error: "Photo not found in your profile" });
    }
  } catch (err) {
    logger.error(
      `Error deleting photo for user ${req.user._id}: ${err.message}`
    );
    res.status(500).json({ error: "Photo delete failed" });
  }
};

// Update essential profile data for new users
export const updateEssentialProfile = async (req, res) => {
  try {
    console.log("🔧 Essential profile update request received");
    console.log("👤 User from request:", req.user ? "User exists" : "No user");
    console.log("🔑 User ID:", req.user?._id);
    console.log("📝 Request body:", req.body);

    const {
      gender,
      partnerGender,
      dateOfBirth,
      partnerAgeMin,
      partnerAgeMax,
      country,
      state,
    } = req.body;
    const userId = req.user._id;

    console.log("🔧 Updating essential profile for user:", userId);
    console.log("📝 Data received:", {
      gender,
      partnerGender,
      dateOfBirth,
      partnerAgeMin,
      partnerAgeMax,
      country,
      state,
    });

    // Validate required fields
    if (
      !gender ||
      !partnerGender ||
      !dateOfBirth ||
      !partnerAgeMin ||
      !partnerAgeMax ||
      !country ||
      !state
    ) {
      return res.status(400).json({
        error:
          "All fields are required: gender, partnerGender, dateOfBirth, partnerAgeMin, partnerAgeMax, country, state",
      });
    }

    // Validate age range
    const minAge = parseInt(partnerAgeMin);
    const maxAge = parseInt(partnerAgeMax);
    if (minAge >= maxAge) {
      return res.status(400).json({
        error: "Minimum age must be less than maximum age",
      });
    }

    // Update user with essential profile data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        gender,
        partnerGender,
        dateOfBirth: new Date(dateOfBirth),
        partnerAgeMin,
        partnerAgeMax,
        country,
        state,
        // Mark that essential profile is complete
        essentialProfileComplete: true,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ Essential profile updated successfully for user:", userId);

    res.status(200).json({
      message: "Essential profile updated successfully",
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        gender: updatedUser.gender,
        partnerGender: updatedUser.partnerGender,
        dateOfBirth: updatedUser.dateOfBirth,
        partnerAgeMin: updatedUser.partnerAgeMin,
        partnerAgeMax: updatedUser.partnerAgeMax,
        country: updatedUser.country,
        state: updatedUser.state,
        essentialProfileComplete: updatedUser.essentialProfileComplete,
      },
    });
  } catch (error) {
    console.error("❌ Error updating essential profile:", error);
    res.status(500).json({
      error: "Failed to update essential profile",
      details: error.message,
    });
  }
};

// Get user partner preferences
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.params.id;
    const { _id: requesterId } = req.user;

    console.log("🔍 Getting preferences for user:", userId);
    console.log("👤 Requester ID:", requesterId);

    // Only the user themselves can view their preferences
    if (userId !== requesterId.toString()) {
      console.log("❌ Access denied - user ID mismatch");
      return res.status(403).json({
        message: "Forbidden: You can only view your own preferences.",
      });
    }

    const user = await User.findById(userId).select(
      "partnerPreferences partnerGender partnerAgeMin partnerAgeMax partnerHeightMin partnerHeightMax partnerEducation partnerOccupation partnerIncome partnerLocation partnerReligion partnerCaste partnerMaritalStatus partnerAbout country state"
    );

    if (!user) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    // Start with partnerPreferences object if it exists
    let preferences = user.partnerPreferences || {};

    // Merge with individual fields from essential profile, but only if partnerPreferences fields are empty
    const mergedPreferences = {
      partnerGender: preferences.partnerGender || user.partnerGender || "",
      partnerAgeMin: preferences.partnerAgeMin || user.partnerAgeMin || "",
      partnerAgeMax: preferences.partnerAgeMax || user.partnerAgeMax || "",
      partnerHeightMin:
        preferences.partnerHeightMin || user.partnerHeightMin || "",
      partnerHeightMax:
        preferences.partnerHeightMax || user.partnerHeightMax || "",
      partnerEducation:
        preferences.partnerEducation || user.partnerEducation || "",
      partnerOccupation:
        preferences.partnerOccupation || user.partnerOccupation || "",
      partnerIncome: preferences.partnerIncome || user.partnerIncome || "",
      partnerCountry: preferences.partnerCountry || user.country || "", // Use country from essential profile
      partnerLocation: preferences.partnerLocation || user.state || "", // Use state from essential profile
      partnerReligion:
        preferences.partnerReligion || user.partnerReligion || "",
      partnerCaste: preferences.partnerCaste || user.partnerCaste || "",
      partnerMaritalStatus:
        preferences.partnerMaritalStatus || user.partnerMaritalStatus || "",
      partnerAbout: preferences.partnerAbout || user.partnerAbout || "",
    };

    console.log("✅ Final merged preferences:", mergedPreferences);
    logger.info(`Fetched partner preferences for user: ${userId}`);
    res.json({ partnerPreferences: mergedPreferences });
  } catch (err) {
    console.error("❌ Error in getUserPreferences:", err);
    logger.error(
      `Error fetching preferences for user ${req.params.id}: ${err.message}`
    );
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
};

// Update user partner preferences
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.params.id;
    const { _id: requesterId } = req.user;

    console.log("🔧 Updating preferences for user:", userId);
    console.log("👤 Requester ID:", requesterId);
    console.log("📝 Request body:", req.body);

    // Only the user themselves can update their preferences
    if (userId !== requesterId.toString()) {
      console.log("❌ Access denied - user ID mismatch");
      return res.status(403).json({
        message: "Forbidden: You can only update your own preferences.",
      });
    }

    const partnerPreferences = req.body;

    // Update both the partnerPreferences object and individual fields for backward compatibility
    const updateData = {
      partnerPreferences: partnerPreferences,
      // Also update individual fields for backward compatibility and essential profile sync
      partnerGender: partnerPreferences.partnerGender || "",
      partnerAgeMin: partnerPreferences.partnerAgeMin || "",
      partnerAgeMax: partnerPreferences.partnerAgeMax || "",
      partnerHeightMin: partnerPreferences.partnerHeightMin || "",
      partnerHeightMax: partnerPreferences.partnerHeightMax || "",
      partnerEducation: partnerPreferences.partnerEducation || "",
      partnerOccupation: partnerPreferences.partnerOccupation || "",
      partnerIncome: partnerPreferences.partnerIncome || "",
      partnerLocation: partnerPreferences.partnerLocation || "",
      partnerReligion: partnerPreferences.partnerReligion || "",
      partnerCaste: partnerPreferences.partnerCaste || "",
      partnerMaritalStatus: partnerPreferences.partnerMaritalStatus || "",
      partnerAbout: partnerPreferences.partnerAbout || "",
      // Also update country and state if they're provided in partner preferences
      ...(partnerPreferences.partnerCountry && {
        country: partnerPreferences.partnerCountry,
      }),
      ...(partnerPreferences.partnerLocation && {
        state: partnerPreferences.partnerLocation,
      }),
    };

    console.log("📝 Update data:", updateData);

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password -pendingChanges");

    if (!updatedUser) {
      console.log("❌ User not found for update:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(
      "✅ Preferences updated successfully:",
      updatedUser.partnerPreferences
    );
    logger.info(`Partner preferences updated for user: ${userId}`);
    res.json({
      message: "Partner preferences updated successfully",
      partnerPreferences: updatedUser.partnerPreferences,
    });
  } catch (err) {
    console.error("❌ Error in updateUserPreferences:", err);
    logger.error(
      `Error updating preferences for user ${req.params.id}: ${err.message}`
    );
    res.status(500).json({ error: "Failed to update preferences" });
  }
};
