import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getUserByUniqueId } from "./idGeneratorService.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base upload directory
const UPLOAD_BASE_DIR = path.join(__dirname, "../uploads");

/**
 * Create user directory structure
 * @param {string} uniqueId - User's unique ID (e.g., MM1001)
 * @returns {Promise<void>}
 */
export const createUserDirectory = async (uniqueId) => {
  try {
    const userDir = path.join(UPLOAD_BASE_DIR, "users", uniqueId);
    const profileDir = path.join(userDir, "profile");
    const chatDir = path.join(userDir, "chat");
    const verificationDir = path.join(userDir, "verification");

    // Create main directories
    const directories = [
      userDir,
      profileDir,
      path.join(profileDir, "photos"),
      path.join(profileDir, "documents"),
      chatDir,
      path.join(chatDir, "images"),
      path.join(chatDir, "videos"),
      path.join(chatDir, "documents"),
      verificationDir,
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    }

    return userDir;
  } catch (error) {
    logger.error("Error creating user directory:", error);
    throw error;
  }
};

/**
 * Generate unique filename with timestamp
 * @param {string} uniqueId - User's unique ID
 * @param {string} category - File category (profile, chat, verification)
 * @param {string} fileType - Type of file (photo, document, image, video)
 * @param {string} originalName - Original filename
 * @param {string} documentType - For verification documents (aadhaar, passport, etc.)
 * @param {string} side - For verification documents (front, back)
 * @returns {string} Generated filename
 */
export const generateFileName = ({
  uniqueId,
  category,
  fileType,
  originalName,
  documentType = null,
  side = null,
}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  const extension = path.extname(originalName);

  let fileName = `${uniqueId}_${category}`;

  if (category === "verification" && documentType) {
    fileName += `_${documentType}`;
    if (side) {
      fileName += `_${side}`;
    }
  } else if (category === "chat") {
    fileName += `_${fileType}_${timestamp}`;
  } else if (category === "profile") {
    // For profile photos, use sequential numbering
    const photoNumber = Math.floor(Math.random() * 1000) + 1;
    fileName += `_${fileType}_${photoNumber.toString().padStart(3, "0")}`;
  }

  return fileName + extension;
};

/**
 * Upload profile photo
 * @param {Object} file - Multer file object
 * @param {string} uniqueId - User's unique ID
 * @returns {Promise<Object>} File data
 */
export const uploadProfilePhoto = async (file, uniqueId) => {
  try {
    await createUserDirectory(uniqueId);

    const fileName = generateFileName({
      uniqueId,
      category: "profile",
      fileType: "photo",
      originalName: file.originalname,
    });

    const filePath = path.join(
      UPLOAD_BASE_DIR,
      "users",
      uniqueId,
      "profile",
      "photos",
      fileName
    );

    // Move file to destination
    fs.copyFileSync(file.path, filePath);
    fs.unlinkSync(file.path); // Remove temp file

    const fileData = {
      url: `/uploads/users/${uniqueId}/profile/photos/${fileName}`,
      fileName: fileName,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storage: "local",
    };

    logger.info(`Profile photo uploaded: ${fileName}`);
    return fileData;
  } catch (error) {
    logger.error("Error uploading profile photo:", error);
    throw error;
  }
};

/**
 * Upload profile document
 * @param {Object} file - Multer file object
 * @param {string} uniqueId - User's unique ID
 * @returns {Promise<Object>} File data
 */
export const uploadProfileDocument = async (file, uniqueId) => {
  try {
    await createUserDirectory(uniqueId);

    const fileName = generateFileName({
      uniqueId,
      category: "profile",
      fileType: "document",
      originalName: file.originalname,
    });

    const filePath = path.join(
      UPLOAD_BASE_DIR,
      "users",
      uniqueId,
      "profile",
      "documents",
      fileName
    );

    // Move file to destination
    fs.copyFileSync(file.path, filePath);
    fs.unlinkSync(file.path); // Remove temp file

    const fileData = {
      url: `/uploads/users/${uniqueId}/profile/documents/${fileName}`,
      fileName: fileName,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storage: "local",
    };

    logger.info(`Profile document uploaded: ${fileName}`);
    return fileData;
  } catch (error) {
    logger.error("Error uploading profile document:", error);
    throw error;
  }
};

/**
 * Upload chat file
 * @param {Object} file - Multer file object
 * @param {string} uniqueId - User's unique ID
 * @param {string} fileType - Type of file (image, video, document)
 * @returns {Promise<Object>} File data
 */
export const uploadChatFile = async (file, uniqueId, fileType) => {
  try {
    await createUserDirectory(uniqueId);

    const fileName = generateFileName({
      uniqueId,
      category: "chat",
      fileType: fileType,
      originalName: file.originalname,
    });

    const filePath = path.join(
      UPLOAD_BASE_DIR,
      "users",
      uniqueId,
      "chat",
      `${fileType}s`,
      fileName
    );

    // Move file to destination
    fs.copyFileSync(file.path, filePath);
    fs.unlinkSync(file.path); // Remove temp file

    const fileData = {
      url: `/uploads/users/${uniqueId}/chat/${fileType}s/${fileName}`,
      fileName: fileName,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storage: "local",
    };

    logger.info(`Chat ${fileType} uploaded: ${fileName}`);
    return fileData;
  } catch (error) {
    logger.error(`Error uploading chat ${fileType}:`, error);
    throw error;
  }
};

/**
 * Upload verification document
 * @param {Object} file - Multer file object
 * @param {string} uniqueId - User's unique ID
 * @param {string} documentType - Type of document (aadhaar, passport, driver_license)
 * @param {string} side - Side of document (front, back)
 * @returns {Promise<Object>} File data
 */
export const uploadVerificationDocument = async (
  file,
  uniqueId,
  documentType,
  side = "front"
) => {
  try {
    await createUserDirectory(uniqueId);

    // Create document-specific directory
    const docDir = path.join(
      UPLOAD_BASE_DIR,
      "users",
      uniqueId,
      "verification",
      documentType
    );
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }

    const fileName = generateFileName({
      uniqueId,
      category: "verification",
      fileType: documentType,
      originalName: file.originalname,
      documentType: documentType,
      side: side,
    });

    const filePath = path.join(docDir, fileName);

    // Move file to destination
    fs.copyFileSync(file.path, filePath);
    fs.unlinkSync(file.path); // Remove temp file

    const fileData = {
      url: `/uploads/users/${uniqueId}/verification/${documentType}/${fileName}`,
      fileName: fileName,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storage: "local",
      documentType: documentType,
      side: side,
    };

    logger.info(`Verification document uploaded: ${fileName}`);
    return fileData;
  } catch (error) {
    logger.error("Error uploading verification document:", error);
    throw error;
  }
};

/**
 * Delete file from storage
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} Success status
 */
export const deleteFile = async (filePath) => {
  try {
    console.log("🗑️ deleteFile called with filePath:", filePath);

    const fullPath = path.join(
      UPLOAD_BASE_DIR,
      filePath.replace("/uploads/", "")
    );
    console.log("🗑️ Full path for deletion:", fullPath);
    console.log("🗑️ File exists:", fs.existsSync(fullPath));

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`File deleted: ${fullPath}`);
      console.log("✅ File deleted successfully:", fullPath);
      return true;
    }
    console.log("❌ File not found:", fullPath);
    return false;
  } catch (error) {
    console.error("❌ Error in deleteFile:", error);
    logger.error("Error deleting file:", error);
    return false;
  }
};

/**
 * Get file URL for access
 * @param {string} filePath - Relative file path
 * @returns {string} Full file URL
 */
export const getFileUrl = (filePath) => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:5000";
  return `${baseUrl}${filePath}`;
};

/**
 * Get user's storage statistics
 * @param {string} uniqueId - User's unique ID
 * @returns {Promise<Object>} Storage statistics
 */
export const getUserStorageStats = async (uniqueId) => {
  try {
    const userDir = path.join(UPLOAD_BASE_DIR, "users", uniqueId);

    if (!fs.existsSync(userDir)) {
      return {
        totalFiles: 0,
        totalSize: 0,
        categories: {
          profile: { files: 0, size: 0 },
          chat: { files: 0, size: 0 },
          verification: { files: 0, size: 0 },
        },
      };
    }

    const stats = {
      totalFiles: 0,
      totalSize: 0,
      categories: {
        profile: { files: 0, size: 0 },
        chat: { files: 0, size: 0 },
        verification: { files: 0, size: 0 },
      },
    };

    // Recursively calculate file stats
    const calculateDirStats = (dirPath, category) => {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach((file) => {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);

          if (stat.isFile()) {
            stats.totalFiles++;
            stats.totalSize += stat.size;
            stats.categories[category].files++;
            stats.categories[category].size += stat.size;
          } else if (stat.isDirectory()) {
            calculateDirStats(filePath, category);
          }
        });
      }
    };

    calculateDirStats(path.join(userDir, "profile"), "profile");
    calculateDirStats(path.join(userDir, "chat"), "chat");
    calculateDirStats(path.join(userDir, "verification"), "verification");

    return stats;
  } catch (error) {
    logger.error("Error getting user storage stats:", error);
    throw error;
  }
};
