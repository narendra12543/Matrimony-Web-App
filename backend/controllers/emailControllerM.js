import User from "../models/User.js"; // Uses your existing User model
import Email from "../models/EmailM.js"; // Correctly imports the new EmailM model
import { sendEmailWithAttachment } from "../services/emailService.js"; // Updated to use merged service

/**
 * Fetches all users to be managed as subscribers.
 */
export const getSubscribers = async (req, res) => {
  try {
    // We select the necessary fields to display in the admin panel
    const users = await User.find()
      .select("email notificationSettings.email")
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching subscribers:", err);
    res.status(500).json({ error: "Server error while fetching users." });
  }
};

/**
 * Sends emails to users based on the target criteria.
 */
export const sendEmail = async (req, res) => {
  const { subject, content, type, target, targetEmail } = req.body;
  const files = req.files;

  try {
    let query = { accountStatus: "active" }; // Start with a base query for active users

    // --- UPDATED QUERY LOGIC ---
    // This logic now includes users who haven't explicitly opted out (field is true OR does not exist)
    switch (target) {
      case "all":
        query["notificationSettings.email.platformUpdates"] = { $ne: false };
        break;
      case "newsletter":
        query["notificationSettings.email.newsletter"] = { $ne: false };
        break;
      case "recommendation":
        query["notificationSettings.email.dailyRecommendations"] = {
          $ne: false,
        };
        break;
      case "specific":
        if (!targetEmail) {
          return res
            .status(400)
            .json({
              message: "Target email is required for specific targeting.",
            });
        }
        query = { email: targetEmail }; // This remains the same for specific sends
        break;
      default:
        return res.status(400).json({ message: "Invalid target specified." });
    }

    const users = await User.find(query);

    if (users.length === 0) {
      return res
        .status(404)
        .json({
          message: `No active users found for the specified target: ${target}.`,
        });
    }

    const attachments = files
      ? files.map((f) => ({
          filename: f.originalname,
          path: f.path,
          contentType: f.mimetype,
        }))
      : [];

    // Send emails with better error handling
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process emails in batches to avoid overwhelming the SMTP server
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < users.length; i += batchSize) {
      batches.push(users.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Add delay between batches to respect rate limits
      if (batchIndex > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
      }

      // Process each user in the current batch
      for (const user of batch) {
        try {
          await sendEmailWithAttachment(user.email, subject, content, attachments);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            email: user.email,
            error: error.message
          });
          
          // Log the specific error but continue with other users
          console.error(`Failed to send email to ${user.email}:`, error.message);
        }
      }
    }

    // Save email record only if at least one email was sent successfully
    let newEmail = null;
    if (results.successful > 0) {
      newEmail = new Email({
        subject,
        content,
        type,
        attachments: files
          ? files.map((f) => ({
              filename: f.originalname,
              path: f.path,
              mimetype: f.mimetype,
            }))
          : [],
      });
      await newEmail.save();
    }

    // Return detailed results
    const message = results.failed === 0 
      ? `Email sent successfully to ${results.successful} user(s)!`
      : `Email sent to ${results.successful} user(s), ${results.failed} failed.`;

    res.status(201).json({ 
      message,
      results,
      email: newEmail
    });
  } catch (err) {
    console.error("Error in sendEmail controller:", err);
    res.status(500).json({ 
      error: "Failed to send or save email.",
      details: err.message 
    });
  }
};

/**
 * Updates a user's email notification preferences.
 */
export const updateSubscriberPreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { notificationSettings } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { "notificationSettings.email": notificationSettings } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating preferences:", err);
    res.status(500).json({ error: "Server error while updating preferences." });
  }
};

/**
 * Fetches a history of all sent emails.
 */
export const getSentEmails = async (req, res) => {
  try {
    const emails = await Email.find().sort({ sentAt: -1 });
    res.status(200).json(emails);
  } catch (err) {
    console.error("Error fetching email history:", err);
    res.status(500).json({ error: "Server error while fetching history." });
  }
};
