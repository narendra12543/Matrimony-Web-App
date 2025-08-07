import Verification from "../models/Verification.js";
import Subscriber from "../models/Subscriber.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { notifyDocumentVerificationRequest } from "../services/adminNotificationService.js";
import {
  sendVerificationApprovalEmail,
  sendVerificationRejectionEmail,
} from "../services/emailService.js";
import { processVerificationDocument } from "../services/verificationService.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- NEW FUNCTION ---
export const createVerificationRequest = async (req, res) => {
  try {
    const { subscriberId, documentType } = req.body;
    const documentFront = req.files.documentFront
      ? req.files.documentFront[0]
      : null;
    const documentBack = req.files.documentBack
      ? req.files.documentBack[0]
      : null;

    // Log incoming data for debugging
    console.log("Received subscriberId:", subscriberId);
    console.log("Received documentType:", documentType);

    if (!subscriberId || !documentType || !documentFront) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Validate subscriberId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
      return res.status(400).json({ error: "Invalid subscriberId format." });
    }

    const subscriber = await Subscriber.findById(subscriberId);
    if (!subscriber) {
      console.error("Subscriber not found for ID:", subscriberId);
      return res.status(404).json({ error: "Subscriber not found." });
    }

    // Get the user's uniqueId for folder structure
    const user = await User.findOne({ subscriberId: subscriber._id });
    if (!user || !user.uniqueId) {
      console.error("User or uniqueId not found for subscriber:", subscriberId);
      return res.status(404).json({ error: "User unique ID not found." });
    }

    const uniqueId = user.uniqueId;
    console.log("Using uniqueId for folder structure:", uniqueId);

    // Process the document FIRST
    const { vulnerabilityScore, extractedData } =
      await processVerificationDocument(documentFront.path, subscriber);

    // Move documents to local storage
    let localFrontPath = null;
    let localBackPath = null;

    try {
      // Create user-specific verification directory structure using uniqueId
      const userVerificationDir = path.join(
        __dirname,
        "../uploads/users",
        uniqueId,
        "verification"
      );
      const documentTypeDir = path.join(userVerificationDir, documentType);

      // Create directories recursively
      if (!fs.existsSync(userVerificationDir)) {
        fs.mkdirSync(userVerificationDir, { recursive: true });
      }
      if (!fs.existsSync(documentTypeDir)) {
        fs.mkdirSync(documentTypeDir, { recursive: true });
      }

      // Move front document to user-specific storage
      const frontFileName = `${documentType}_front_${Date.now()}${path.extname(
        documentFront.originalname
      )}`;
      localFrontPath = path.join(documentTypeDir, frontFileName);
      fs.copyFileSync(documentFront.path, localFrontPath);

      // Move back document to user-specific storage if provided
      if (documentBack) {
        const backFileName = `${documentType}_back_${Date.now()}${path.extname(
          documentBack.originalname
        )}`;
        localBackPath = path.join(documentTypeDir, backFileName);
        fs.copyFileSync(documentBack.path, localBackPath);
      }

      // Clean up temporary files
      fs.unlinkSync(documentFront.path);
      if (documentBack) {
        fs.unlinkSync(documentBack.path);
      }
    } catch (storageError) {
      console.error("Local storage failed:", storageError);
      // Clean up temporary files if storage fails
      if (fs.existsSync(documentFront.path)) {
        fs.unlinkSync(documentFront.path);
      }
      if (documentBack && fs.existsSync(documentBack.path)) {
        fs.unlinkSync(documentBack.path);
      }
      return res.status(500).json({
        error: "Failed to store document locally. Please try again.",
      });
    }

    // If score is high, flag for admin review. Otherwise, auto-approve.
    const status = vulnerabilityScore > 6 ? "pending_review" : "auto_approved";

    // Store relative paths instead of full file system paths
    const relativeFrontPath = localFrontPath
      ? path.relative(path.join(__dirname, "../uploads"), localFrontPath)
      : null;
    const relativeBackPath = localBackPath
      ? path.relative(path.join(__dirname, "../uploads"), localBackPath)
      : null;

    const newVerification = new Verification({
      subscriber: subscriberId,
      documentType,
      documentFrontPath: relativeFrontPath, // Store relative path
      documentBackPath: relativeBackPath, // Store relative path
      vulnerabilityScore,
      extractedData,
      status,
    });

    await newVerification.save();

    // Update subscriber status
    const newStatus =
      status === "auto_approved" ? "active" : "pending_verification";
    subscriber.status = newStatus;
    await subscriber.save();

    // Send notification to user about verification status
    try {
      await createNotification({
        user: subscriber._id,
        type: "verification",
        title: "Document Verification Submitted",
        message:
          vulnerabilityScore <= 3
            ? "Your document verification has been automatically approved! Your profile is now active."
            : "Your document verification has been submitted for admin review. You'll be notified once reviewed.",
        data: {
          verificationId: newVerification._id,
          status: newVerification.status,
        },
      });
    } catch (notificationError) {
      console.error("Error sending user notification:", notificationError);
    }

    // Send admin notification for new verification request
    try {
      console.log(
        "Attempting to send admin notification for verification request"
      );
      const User = (await import("../models/User.js")).default;
      const user = await User.findOne({ subscriberId: subscriber._id });

      if (user) {
        console.log(
          "User found for admin notification:",
          user.firstName,
          user.lastName
        );
        await notifyDocumentVerificationRequest({
          verificationId: newVerification._id,
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
          documentType: documentType,
          vulnerabilityScore: vulnerabilityScore,
        });
        console.log("Admin notification sent successfully");
      } else {
        console.log("No user found for subscriber:", subscriber._id);
      }
    } catch (adminNotificationError) {
      console.error(
        "Error sending admin notification:",
        adminNotificationError
      );
    }

    res.status(201).json({
      message: `Verification submitted. Score: ${vulnerabilityScore}. Status: ${status}`,
      verification: newVerification,
    });
  } catch (err) {
    console.error("Error creating verification request:", err);
    res.status(500).json({ error: "Server error while creating request." });
  }
};

// --- FILLED IN EXISTING FUNCTIONS ---
export const getVerificationRequests = async (req, res) => {
  try {
    const { status, subscriberId } = req.query;
    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by subscriberId if provided (for user's own verification status)
    if (subscriberId) {
      query.subscriber = subscriberId;
    }

    // Fetch verification requests with populated subscriber data
    const requests = await Verification.find(query)
      .populate("subscriber", "name email dob")
      .sort({ submittedAt: "asc" });

    // Enhance each request with user information
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        try {
          // Find the user associated with this subscriber
          const User = (await import("../models/User.js")).default;
          const user = await User.findOne({
            subscriberId: request.subscriber._id,
          });

          if (user) {
            return {
              ...request.toObject(),
              user: {
                firstName: user.firstName,
                lastName: user.lastName,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                photos: user.photos,
                email: user.email,
                phone: user.phone,
                city: user.city,
                state: user.state,
                occupation: user.occupation,
                education: user.education,
                maritalStatus: user.maritalStatus,
                religion: user.religion,
                caste: user.caste,
                motherTongue: user.motherTongue,
                height: user.height,
                weight: user.weight,
                complexion: user.complexion,
                bodyType: user.bodyType,
                manglik: user.manglik,
                physicalStatus: user.physicalStatus,
                annualIncome: user.annualIncome,
                familyType: user.familyType,
                familyStatus: user.familyStatus,
                familyValues: user.familyValues,
                diet: user.diet,
                smoking: user.smoking,
                drinking: user.drinking,
                hobbies: user.hobbies,
                interests: user.interests,
                aboutMe: user.aboutMe,
              },
            };
          } else {
            // If no user found, return request with basic subscriber info
            return {
              ...request.toObject(),
              user: {
                firstName: request.subscriber.name,
                lastName: "",
                email: request.subscriber.email,
                dateOfBirth: request.subscriber.dob,
                gender: "Not specified",
                photos: [],
              },
            };
          }
        } catch (error) {
          console.error("Error fetching user data for verification:", error);
          return request.toObject();
        }
      })
    );

    res.status(200).json(enhancedRequests);
  } catch (err) {
    console.error("Error fetching verification requests:", err);
    res.status(500).json({ error: "Server error while fetching requests." });
  }
};

export const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body; // Expect 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status provided. Must be "approved" or "rejected".',
      });
    }

    const verificationRequest = await Verification.findById(id);
    if (!verificationRequest) {
      return res.status(404).json({ error: "Verification request not found." });
    }

    // Update the verification request itself
    verificationRequest.status = status;
    verificationRequest.adminNotes = adminNotes || "";
    verificationRequest.reviewedAt = new Date();
    await verificationRequest.save();

    // If approved, set subscriber status to 'active'. If rejected, 'unverified'.
    const newSubscriberStatus = status === "approved" ? "active" : "unverified";
    await Subscriber.findByIdAndUpdate(verificationRequest.subscriber, {
      $set: { status: newSubscriberStatus },
    });

    // Find the user ID from the subscriber ID
    const subscriber = await Subscriber.findById(
      verificationRequest.subscriber
    );
    if (!subscriber) {
      console.error(
        "Subscriber not found for verification:",
        verificationRequest.subscriber
      );
      return res.status(404).json({ error: "Subscriber not found." });
    }

    // Find the user that owns this subscriber
    const User = (await import("../models/User.js")).default;
    const user = await User.findOne({
      subscriberId: verificationRequest.subscriber,
    });

    if (!user) {
      console.error(
        "User not found for subscriber:",
        verificationRequest.subscriber
      );
      return res.status(404).json({ error: "User not found." });
    }

    // Send notification to user about admin decision
    const notificationMessage =
      status === "approved"
        ? "Your document verification has been approved by our admin team! Now you are allow to access all featuers."
        : `Your document verification has been rejected. Reason: ${
            adminNotes || "No reason provided"
          }`;

    try {
      const notification = await createNotification({
        user: user._id, // Send to user ID, not subscriber ID
        type: "verification",
        title: "Verification Decision",
        message: notificationMessage,
        data: {
          verificationId: verificationRequest._id,
          status: status,
          adminNotes: adminNotes,
        },
      });

      // Send email notification
      try {
        if (status === "approved") {
          await sendVerificationApprovalEmail(
            user.email,
            user.firstName,
            verificationRequest.documentType
          );
          logger.info(`Verification approval email sent to ${user.email}`);
        } else {
          await sendVerificationRejectionEmail(
            user.email,
            user.firstName,
            verificationRequest.documentType,
            adminNotes || "Document verification was not approved"
          );
          logger.info(`Verification rejection email sent to ${user.email}`);
        }
      } catch (emailError) {
        logger.error(
          `Failed to send verification ${status} email to ${user.email}: ${emailError.message}`
        );
        // Don't fail the entire request if email fails
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Don't fail the entire request if notification fails
    }

    res.status(200).json(verificationRequest);
  } catch (err) {
    console.error("Error updating verification status:", err);
    res.status(500).json({ error: "Server error while updating status." });
  }
};
