import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";

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
