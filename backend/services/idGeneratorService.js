import IdCounter from "../models/IdCounter.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

/**
 * Get the next available unique ID number
 * @returns {Promise<number>} Next available ID number
 */
export const getNextId = async () => {
  try {
    // Find or create the ID counter document
    let counter = await IdCounter.findOne();

    if (!counter) {
      counter = new IdCounter({ currentId: 1000 });
    }

    // Increment the counter
    counter.currentId += 1;
    counter.lastUpdated = new Date();
    await counter.save();

    return counter.currentId;
  } catch (error) {
    logger.error("Error getting next ID:", error);
    throw new Error("Failed to generate unique ID");
  }
};

/**
 * Generate a unique ID in MM#### format
 * @returns {Promise<string>} Unique ID like "MM1001"
 */
export const generateUniqueId = async () => {
  try {
    const nextId = await getNextId();
    return `MM${nextId}`;
  } catch (error) {
    logger.error("Error generating unique ID:", error);
    throw error;
  }
};

/**
 * Assign a unique ID to a user
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {Promise<string>} Assigned unique ID
 */
export const assignUniqueIdToUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.uniqueId) {
      return user.uniqueId; // Already has unique ID
    }

    const uniqueId = await generateUniqueId();

    // Check if unique ID already exists
    const existingUser = await User.findOne({ uniqueId });
    if (existingUser) {
      // If collision, try again
      return await assignUniqueIdToUser(userId);
    }

    // Assign unique ID to user
    user.uniqueId = uniqueId;
    await user.save();

    logger.info(`Assigned unique ID ${uniqueId} to user ${userId}`);
    return uniqueId;
  } catch (error) {
    logger.error("Error assigning unique ID to user:", error);
    throw error;
  }
};

/**
 * Validate unique ID format
 * @param {string} uniqueId - ID to validate
 * @returns {boolean} True if valid format
 */
export const validateUniqueId = (uniqueId) => {
  const pattern = /^MM\d{4,}$/;
  return pattern.test(uniqueId);
};

/**
 * Get user by unique ID
 * @param {string} uniqueId - Unique ID to search for
 * @returns {Promise<Object>} User object
 */
export const getUserByUniqueId = async (uniqueId) => {
  try {
    if (!validateUniqueId(uniqueId)) {
      throw new Error("Invalid unique ID format");
    }

    const user = await User.findOne({ uniqueId });
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    logger.error("Error getting user by unique ID:", error);
    throw error;
  }
};

/**
 * Initialize ID counter if it doesn't exist
 * @returns {Promise<void>}
 */
export const initializeIdCounter = async () => {
  try {
    const counter = await IdCounter.findOne();
    if (!counter) {
      await new IdCounter({ currentId: 1000 }).save();
      logger.info("ID counter initialized");
    }
  } catch (error) {
    logger.error("Error initializing ID counter:", error);
  }
};
