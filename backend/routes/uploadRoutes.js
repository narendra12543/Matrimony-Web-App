import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import {
  uploadProfilePhoto,
  uploadProfileDocument,
  uploadChatFile,
  uploadVerificationDocument,
  deleteFile,
  getUserStorageStats,
} from "../services/fileStorageService.js";
import { assignUniqueIdToUser } from "../services/idGeneratorService.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Configure multer for temporary file storage
const upload = multer({
  dest: "uploads/temp/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  },
});

// ===== PROFILE UPLOAD ENDPOINTS =====

// Upload profile photo
router.post(
  "/profile/photo",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Ensure user has unique ID
      const uniqueId = await assignUniqueIdToUser(req.user._id);

      // Upload profile photo
      const fileData = await uploadProfilePhoto(req.file, uniqueId);

      console.log("📸 Backend fileData:", fileData);

      res.json({
        message: "Profile photo uploaded successfully",
        file: fileData,
      });
    } catch (error) {
      logger.error("Profile photo upload error:", error);
      res.status(500).json({
        message: "Profile photo upload failed",
        error: error.message,
      });
    }
  }
);

// Upload profile document
router.post(
  "/profile/document",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Ensure user has unique ID
      const uniqueId = await assignUniqueIdToUser(req.user._id);

      // Upload profile document
      const fileData = await uploadProfileDocument(req.file, uniqueId);

      res.json({
        message: "Profile document uploaded successfully",
        file: fileData,
      });
    } catch (error) {
      logger.error("Profile document upload error:", error);
      res.status(500).json({
        message: "Profile document upload failed",
        error: error.message,
      });
    }
  }
);

// ===== CHAT UPLOAD ENDPOINTS =====

// Upload chat image
router.post(
  "/chat/image",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type
      if (!req.file.mimetype.startsWith("image/")) {
        return res
          .status(400)
          .json({ message: "Only image files are allowed" });
      }

      // Ensure user has unique ID
      const uniqueId = await assignUniqueIdToUser(req.user._id);

      // Upload chat image
      const fileData = await uploadChatFile(req.file, uniqueId, "image");

      res.json({
        message: "Chat image uploaded successfully",
        file: fileData,
      });
    } catch (error) {
      logger.error("Chat image upload error:", error);
      res.status(500).json({
        message: "Chat image upload failed",
        error: error.message,
      });
    }
  }
);

// Upload chat video
router.post(
  "/chat/video",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type
      if (!req.file.mimetype.startsWith("video/")) {
        return res
          .status(400)
          .json({ message: "Only video files are allowed" });
      }

      // Ensure user has unique ID
      const uniqueId = await assignUniqueIdToUser(req.user._id);

      // Upload chat video
      const fileData = await uploadChatFile(req.file, uniqueId, "video");

      res.json({
        message: "Chat video uploaded successfully",
        file: fileData,
      });
    } catch (error) {
      logger.error("Chat video upload error:", error);
      res.status(500).json({
        message: "Chat video upload failed",
        error: error.message,
      });
    }
  }
);

// Upload chat document
router.post(
  "/chat/document",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/rtf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Only document files are allowed" });
      }

      // Ensure user has unique ID
      const uniqueId = await assignUniqueIdToUser(req.user._id);

      // Upload chat document
      const fileData = await uploadChatFile(req.file, uniqueId, "document");

      res.json({
        message: "Chat document uploaded successfully",
        file: fileData,
      });
    } catch (error) {
      logger.error("Chat document upload error:", error);
      res.status(500).json({
        message: "Chat document upload failed",
        error: error.message,
      });
    }
  }
);

// ===== VERIFICATION UPLOAD ENDPOINTS =====

// Upload Aadhaar document
router.post(
  "/verification/aadhaar",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { side = "front" } = req.body;

      // Ensure user has unique ID
      const uniqueId = await assignUniqueIdToUser(req.user._id);

      // Upload verification document
      const fileData = await uploadVerificationDocument(
        req.file,
        uniqueId,
        "aadhaar",
        side
      );

      res.json({
        message: "Aadhaar document uploaded successfully",
        file: fileData,
      });
    } catch (error) {
      logger.error("Aadhaar upload error:", error);
      res.status(500).json({
        message: "Aadhaar document upload failed",
        error: error.message,
      });
    }
  }
);

// Upload Passport document
router.post(
  "/verification/passport",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { side = "front" } = req.body;

      // Ensure user has unique ID
      const uniqueId = await assignUniqueIdToUser(req.user._id);

      // Upload verification document
      const fileData = await uploadVerificationDocument(
        req.file,
        uniqueId,
        "passport",
        side
      );

      res.json({
        message: "Passport document uploaded successfully",
        file: fileData,
      });
    } catch (error) {
      logger.error("Passport upload error:", error);
      res.status(500).json({
        message: "Passport document upload failed",
        error: error.message,
      });
    }
  }
);

// Upload Driver's License document
router.post(
  "/verification/driver-license",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { side = "front" } = req.body;

      // Ensure user has unique ID
      const uniqueId = await assignUniqueIdToUser(req.user._id);

      // Upload verification document
      const fileData = await uploadVerificationDocument(
        req.file,
        uniqueId,
        "driver_license",
        side
      );

      res.json({
        message: "Driver's License document uploaded successfully",
        file: fileData,
      });
    } catch (error) {
      logger.error("Driver's License upload error:", error);
      res.status(500).json({
        message: "Driver's License document upload failed",
        error: error.message,
      });
    }
  }
);

// ===== FILE MANAGEMENT ENDPOINTS =====

// Delete file
router.delete("/file", authenticate, async (req, res) => {
  try {
    const { filePath } = req.body;
    console.log("🗑️ Backend delete request - filePath:", filePath);
    console.log("🗑️ Backend delete request - body:", req.body);

    if (!filePath) {
      console.log("❌ Backend delete error: No filePath provided");
      return res.status(400).json({ message: "File path is required" });
    }

    const success = await deleteFile(filePath);
    console.log("🗑️ Backend delete result:", success);

    if (success) {
      res.json({ message: "File deleted successfully" });
    } else {
      res.status(404).json({ message: "File not found" });
    }
  } catch (error) {
    console.error("❌ Backend file deletion error:", error);
    logger.error("File deletion error:", error);
    res.status(500).json({
      message: "File deletion failed",
      error: error.message,
    });
  }
});

// Get user storage statistics
router.get("/storage/stats", authenticate, async (req, res) => {
  try {
    // Ensure user has unique ID
    const uniqueId = await assignUniqueIdToUser(req.user._id);

    const stats = await getUserStorageStats(uniqueId);

    res.json({
      message: "Storage statistics retrieved successfully",
      stats,
    });
  } catch (error) {
    logger.error("Storage stats error:", error);
    res.status(500).json({
      message: "Failed to get storage statistics",
      error: error.message,
    });
  }
});

// ===== LEGACY SUPPORT =====

// Legacy upload endpoint for backward compatibility
router.post("/", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Determine file type
    let fileType = "document";
    if (req.file.mimetype.startsWith("image/")) {
      fileType = "image";
    } else if (req.file.mimetype.startsWith("video/")) {
      fileType = "video";
    }

    // Ensure user has unique ID
    const uniqueId = await assignUniqueIdToUser(req.user._id);

    // Upload as chat file (legacy behavior)
    const fileData = await uploadChatFile(req.file, uniqueId, fileType);

    res.json({
      message: "File uploaded successfully",
      file: fileData,
    });
  } catch (error) {
    logger.error("Legacy upload error:", error);
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
});

export default router;
