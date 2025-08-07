import User from "../../models/User.js";
import { createNotification } from "../../services/notificationService.js";
import {
  sendProfileApprovalEmail,
  sendProfileRejectionEmail,
} from "../../services/emailService.js";
import logger from "../../utils/logger.js";

// Get all users with pending profile changes
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await User.find({ approvalStatus: "pending" }).select(
      "-password"
    );
    // For each user, fetch their verification document
    const usersWithDocs = await Promise.all(
      pendingUsers.map(async (user) => {
        return {
          ...user.toObject(),
        };
      })
    );
    res.json(usersWithDocs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching pending approvals", error });
  }
};

// Get new users (users with no pending changes but approvalStatus pending)
export const getNewUsers = async (req, res) => {
  try {
    // Find users who are pending approval and either:
    // 1. Have isNewUser: true, OR
    // 2. Have no pendingChanges (meaning they're new users)
    const newUsers = await User.find({
      approvalStatus: "pending",
      $or: [
        { isNewUser: true },
        {
          pendingChanges: { $exists: false },
        },
        {
          pendingChanges: {},
        },
      ],
    }).select("-password");

    console.log(`Found ${newUsers.length} new users pending approval`);
    res.json(newUsers);
  } catch (error) {
    console.error("Error fetching new users:", error);
    res.status(500).json({ message: "Error fetching new users", error });
  }
};

// Get profile changes (users with pending changes)
export const getProfileChanges = async (req, res) => {
  try {
    // Find users who are pending approval and have actual pending changes
    const profileChanges = await User.find({
      approvalStatus: "pending",
      isNewUser: { $ne: true }, // Not a new user
      pendingChanges: {
        $exists: true,
        $ne: {},
      },
    }).select("-password");

    console.log(
      `Found ${profileChanges.length} profile changes pending approval`
    );
    res.json(profileChanges);
  } catch (error) {
    console.error("Error fetching profile changes:", error);
    res.status(500).json({ message: "Error fetching profile changes", error });
  }
};

// Approve a user's profile changes
export const approveProfileChanges = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if this is a new user (no pending changes) or existing user with changes
    const isNewUser =
      !user.pendingChanges || Object.keys(user.pendingChanges).length === 0;

    if (isNewUser) {
      // For new users, just approve their initial profile
      user.approvalStatus = "approved";
      user.isNewUser = false; // Mark as no longer a new user

      // Send notification for new user approval
      await createNotification({
        user: userId,
        type: "profile_approved",
        title: "Account Approved!",
        message:
          "Your account has been approved by the admin. You can now use all features.",
        link: "/profile",
      });

      // Send email notification for new user approval
      try {
        await sendProfileApprovalEmail(user.email, user.firstName, true);
        logger.info(`New user approval email sent to ${user.email}`);
      } catch (emailError) {
        logger.error(
          `Failed to send new user approval email to ${user.email}: ${emailError.message}`
        );
        // Don't fail the entire request if email fails
      }
    } else {
      // For existing users, apply pending changes to the actual user fields
      for (const key in user.pendingChanges) {
        if (key === "photos") {
          // For photos, replace the old photos with the new ones
          user.photos = user.pendingChanges.photos;
        } else {
          // For other fields, apply the pending change
          user[key] = user.pendingChanges[key];
        }
      }

      // Clear pending changes and set approval status to approved
      user.pendingChanges = {};
      user.approvalStatus = "approved";

      // Send notification for profile changes approval
      await createNotification({
        user: userId,
        type: "profile_approved",
        title: "Profile Changes Approved!",
        message: "Your recent profile updates have been approved by the admin.",
        link: "/profile",
      });

      // Send email notification for profile changes approval
      try {
        await sendProfileApprovalEmail(user.email, user.firstName, false);
        logger.info(`Profile changes approval email sent to ${user.email}`);
      } catch (emailError) {
        logger.error(
          `Failed to send profile changes approval email to ${user.email}: ${emailError.message}`
        );
        // Don't fail the entire request if email fails
      }
    }

    await user.save();

    res.json({
      message: isNewUser
        ? "New user approved successfully"
        : "Profile changes approved successfully",
      user,
    });
  } catch (error) {
    console.error("Error approving profile changes:", error);
    res.status(500).json({ message: "Error approving profile changes", error });
  }
};

// Reject a user's profile changes
export const rejectProfileChanges = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Rejection reason is required." });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if this is a new user (no pending changes) or existing user with changes
    const isNewUser =
      !user.pendingChanges || Object.keys(user.pendingChanges).length === 0;

    if (isNewUser) {
      // For new users, reject their account
      user.approvalStatus = "rejected";
      user.accountStatus = "suspended"; // Suspend the account

      // Send notification for new user rejection
      await createNotification({
        user: userId,
        type: "profile_rejected",
        title: "Account Rejected",
        message:
          "Your account registration was rejected by the admin. Reason: " +
          reason,
        link: "/profile",
      });

      // Send email notification for new user rejection
      try {
        await sendProfileRejectionEmail(
          user.email,
          user.firstName,
          reason,
          true
        );
        logger.info(`New user rejection email sent to ${user.email}`);
      } catch (emailError) {
        logger.error(
          `Failed to send new user rejection email to ${user.email}: ${emailError.message}`
        );
        // Don't fail the entire request if email fails
      }
    } else {
      // For existing users, reject their pending changes
      user.pendingChanges = {};
      user.approvalStatus = "rejected";

      // Send notification for profile changes rejection
      await createNotification({
        user: userId,
        type: "profile_rejected",
        title: "Profile Changes Rejected",
        message:
          "Your recent profile updates were rejected by the admin. Reason: " +
          reason,
        link: "/profile",
      });

      // Send email notification for profile changes rejection
      try {
        await sendProfileRejectionEmail(
          user.email,
          user.firstName,
          reason,
          false
        );
        logger.info(`Profile changes rejection email sent to ${user.email}`);
      } catch (emailError) {
        logger.error(
          `Failed to send profile changes rejection email to ${user.email}: ${emailError.message}`
        );
        // Don't fail the entire request if email fails
      }
    }

    await user.save();

    res.json({
      message: isNewUser
        ? "New user rejected successfully"
        : "Profile changes rejected successfully",
      user,
    });
  } catch (error) {
    console.error("Error rejecting profile changes:", error);
    res.status(500).json({ message: "Error rejecting profile changes", error });
  }
};

// Approve a new user
export const approveNewUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isNewUser) {
      return res.status(400).json({ message: "This is not a new user" });
    }

    // Approve the new user
    user.approvalStatus = "approved";
    user.isNewUser = false; // Mark as no longer a new user

    // Send notification for new user approval
    await createNotification({
      user: userId,
      type: "profile_approved",
      title: "Account Approved!",
      message:
        "Your account has been approved by the admin. You can now use all features.",
      link: "/profile",
    });

    // Send admin notification for new user approval
    try {
      const { notifyNewUserApproval } = await import(
        "../../services/adminNotificationService.js"
      );
      await notifyNewUserApproval({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        approvedBy: req.admin._id,
        approvedAt: new Date(),
      });
      logger.info(
        `Admin notification sent for new user approval: ${user.email}`
      );
    } catch (adminNotificationError) {
      logger.error(
        `Failed to send admin notification for new user approval: ${adminNotificationError.message}`
      );
      // Don't fail the entire request if admin notification fails
    }

    // Send email notification for new user approval
    try {
      await sendProfileApprovalEmail(user.email, user.firstName, true);
      logger.info(`New user approval email sent to ${user.email}`);
    } catch (emailError) {
      logger.error(
        `Failed to send new user approval email to ${user.email}: ${emailError.message}`
      );
      // Don't fail the entire request if email fails
    }

    await user.save();
    res.json({ message: "New user approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error approving new user", error });
  }
};

// Reject a new user
export const rejectNewUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isNewUser) {
      return res.status(400).json({ message: "This is not a new user" });
    }

    // Reject the new user
    user.approvalStatus = "rejected";

    // Send notification for new user rejection
    await createNotification({
      user: userId,
      type: "profile_rejected",
      title: "Account Rejected",
      message: `Your account registration was not approved. Reason: ${reason}`,
      link: "/profile",
    });

    // Send admin notification for new user rejection
    try {
      const { notifyNewUserRejection } = await import(
        "../../services/adminNotificationService.js"
      );
      await notifyNewUserRejection({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        rejectedBy: req.admin._id,
        rejectedAt: new Date(),
        reason: reason,
      });
      logger.info(
        `Admin notification sent for new user rejection: ${user.email}`
      );
    } catch (adminNotificationError) {
      logger.error(
        `Failed to send admin notification for new user rejection: ${adminNotificationError.message}`
      );
      // Don't fail the entire request if admin notification fails
    }

    // Send email notification for new user rejection
    try {
      await sendProfileRejectionEmail(user.email, user.firstName, reason, true);
      logger.info(`New user rejection email sent to ${user.email}`);
    } catch (emailError) {
      logger.error(
        `Failed to send new user rejection email to ${user.email}: ${emailError.message}`
      );
      // Don't fail the entire request if email fails
    }

    await user.save();
    res.json({ message: "New user rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting new user", error });
  }
};
