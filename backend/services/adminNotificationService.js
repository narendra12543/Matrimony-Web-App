import Admin from "../models/Admin.js";
import Notification from "../models/Notification.js";
import { getIO } from "../utils/socket.js";

// Get all admin users
const getAllAdmins = async () => {
  try {
    console.log("getAllAdmins called");
    const admins = await Admin.find({});
    console.log(
      "Found admins:",
      admins.map((admin) => ({ id: admin._id, email: admin.email }))
    );
    return admins;
  } catch (error) {
    console.error("Error fetching admins:", error);
    return [];
  }
};

// Send notification to all admins
export const sendAdminNotification = async (notificationData) => {
  try {
    console.log("🔔 sendAdminNotification called with:", notificationData);

    const admins = await getAllAdmins();
    console.log("🔔 Found admins:", admins.length);

    if (admins.length === 0) {
      console.log("⚠️ No admins found to send notification to");
      return [];
    }

    const notifications = [];
    for (const admin of admins) {
      console.log("🔔 Creating notification for admin:", admin.email);
      console.log("🔔 Admin ID:", admin._id);

      // Create notification with admin ID as user field
      // Note: We're using the admin._id as the user field for admin notifications
      const notification = new Notification({
        user: admin._id, // Use admin ID as user field
        type: notificationData.type || "admin_system_alert",
        title: notificationData.title,
        message: notificationData.message,
        link: notificationData.link,
        data: {
          ...notificationData.data,
          isAdminNotification: true, // Mark as admin notification
          adminId: admin._id,
          adminEmail: admin.email,
        },
      });

      console.log("🔔 Notification object created:", {
        user: notification.user,
        type: notification.type,
        title: notification.title,
        message: notification.message,
      });

      await notification.save();
      console.log("🔔 Notification saved for admin:", admin.email);
      notifications.push(notification);

      // Send real-time notification via WebSocket
      try {
        const io = getIO();
        io.to(admin._id.toString()).emit("new-notification", notification);
        console.log("🔔 WebSocket notification sent to admin:", admin.email);
      } catch (socketError) {
        console.error(
          "❌ Error sending admin notification via WebSocket:",
          socketError
        );
      }
    }

    console.log(
      `✅ Admin notification sent to ${admins.length} admins:`,
      notificationData.title
    );
    return notifications;
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
};

// Specific admin notification functions for different events
export const notifyNewUserRegistration = async (userData) => {
  console.log("🔔 notifyNewUserRegistration called with userData:", userData);

  try {
    await sendAdminNotification({
      type: "admin_new_user",
      title: "New User Registration",
      message: `A new user ${userData.firstName} ${userData.lastName} (${userData.email}) has registered and is waiting for admin approval. Please review their profile and approve or reject their account.`,
      link: "/admin/new-user-approvals",
      data: {
        eventType: "new_user_registration",
        userId: userData._id,
        userEmail: userData.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        registrationTime: new Date(),
      },
    });
    console.log("✅ notifyNewUserRegistration completed successfully");
  } catch (error) {
    console.error("❌ Error in notifyNewUserRegistration:", error);
    throw error;
  }
};

export const notifyNewUserApproval = async (approvalData) => {
  console.log(
    "🔔 notifyNewUserApproval called with approvalData:",
    approvalData
  );

  try {
    await sendAdminNotification({
      type: "admin_new_user_approved",
      title: "User Account Approved",
      message: `User account for ${approvalData.firstName} ${approvalData.lastName} (${approvalData.email}) has been approved by admin and is now active.`,
      link: "/admin/users",
      data: {
        eventType: "new_user_approved",
        userId: approvalData._id,
        userEmail: approvalData.email,
        userName: `${approvalData.firstName} ${approvalData.lastName}`,
        approvedBy: approvalData.approvedBy,
        approvedAt: approvalData.approvedAt,
      },
    });
    console.log("✅ notifyNewUserApproval completed successfully");
  } catch (error) {
    console.error("❌ Error in notifyNewUserApproval:", error);
    throw error;
  }
};

export const notifyNewUserRejection = async (rejectionData) => {
  console.log(
    "🔔 notifyNewUserRejection called with rejectionData:",
    rejectionData
  );

  try {
    await sendAdminNotification({
      type: "admin_new_user_rejected",
      title: "User Account Rejected",
      message: `User account for ${rejectionData.firstName} ${rejectionData.lastName} (${rejectionData.email}) has been rejected by admin. Reason: ${rejectionData.reason}`,
      link: "/admin/users",
      data: {
        eventType: "new_user_rejected",
        userId: rejectionData._id,
        userEmail: rejectionData.email,
        userName: `${rejectionData.firstName} ${rejectionData.lastName}`,
        rejectedBy: rejectionData.rejectedBy,
        rejectedAt: rejectionData.rejectedAt,
        reason: rejectionData.reason,
      },
    });
    console.log("✅ notifyNewUserRejection completed successfully");
  } catch (error) {
    console.error("❌ Error in notifyNewUserRejection:", error);
    throw error;
  }
};

export const notifyDocumentVerificationRequest = async (verificationData) => {
  await sendAdminNotification({
    type: "admin_verification_request",
    title: "New Document Verification Request",
    message: `User ${verificationData.userName} has submitted ${verificationData.documentType} for verification. Vulnerability Score: ${verificationData.vulnerabilityScore}/10`,
    link: "/admin/verification",
    data: {
      eventType: "document_verification_request",
      verificationId: verificationData.verificationId,
      userId: verificationData.userId,
      documentType: verificationData.documentType,
      vulnerabilityScore: verificationData.vulnerabilityScore,
    },
  });
};

export const notifySuspiciousActivity = async (activityData) => {
  await sendAdminNotification({
    type: "admin_suspicious_activity",
    title: "Suspicious Activity Detected",
    message: `Suspicious activity detected: ${activityData.description}. User: ${activityData.userName} (${activityData.userEmail})`,
    link: "/admin/users",
    data: {
      eventType: "suspicious_activity",
      userId: activityData.userId,
      activityType: activityData.activityType,
      severity: activityData.severity || "medium",
      details: activityData.details,
    },
  });
};

export const notifyUserReport = async (reportData) => {
  await sendAdminNotification({
    type: "admin_user_report",
    title: "New User Report",
    message: `User ${reportData.reportedBy} has reported ${reportData.reportedUser} for: ${reportData.reason}`,
    link: "/admin/reports",
    data: {
      eventType: "user_report",
      reportId: reportData.reportId,
      reportedBy: reportData.reportedBy,
      reportedUser: reportData.reportedUser,
      reason: reportData.reason,
    },
  });
};

export const notifySystemAlert = async (alertData) => {
  await sendAdminNotification({
    type: "admin_system_alert",
    title: "System Alert",
    message: alertData.message,
    link: alertData.link || "/admin/dashboard",
    data: {
      eventType: "system_alert",
      alertType: alertData.alertType,
      severity: alertData.severity || "info",
      timestamp: new Date(),
    },
  });
};

export const notifyPaymentIssue = async (paymentData) => {
  await sendAdminNotification({
    type: "admin_payment_issue",
    title: "Payment Processing Issue",
    message: `Payment issue detected for user ${paymentData.userName}. Amount: ${paymentData.amount}, Error: ${paymentData.error}`,
    link: "/admin/payments",
    data: {
      eventType: "payment_issue",
      userId: paymentData.userId,
      paymentId: paymentData.paymentId,
      amount: paymentData.amount,
      error: paymentData.error,
    },
  });
};

export const notifyHighTraffic = async (trafficData) => {
  await sendAdminNotification({
    type: "admin_high_traffic",
    title: "High Traffic Alert",
    message: `High traffic detected: ${trafficData.activeUsers} active users, ${trafficData.requestsPerMinute} requests/minute`,
    link: "/admin/analytics",
    data: {
      eventType: "high_traffic",
      activeUsers: trafficData.activeUsers,
      requestsPerMinute: trafficData.requestsPerMinute,
      timestamp: new Date(),
    },
  });
};

export const notifySecurityBreach = async (securityData) => {
  await sendAdminNotification({
    type: "admin_security_breach",
    title: "Security Breach Alert",
    message: `Security breach detected: ${securityData.description}. IP: ${
      securityData.ipAddress
    }, User: ${securityData.userName || "Unknown"}`,
    link: "/admin/security",
    data: {
      eventType: "security_breach",
      ipAddress: securityData.ipAddress,
      userId: securityData.userId,
      breachType: securityData.breachType,
      severity: securityData.severity || "high",
    },
  });
};

export const notifySubscriptionExpiry = async (subscriptionData) => {
  await sendAdminNotification({
    type: "admin_subscription_expiry",
    title: "Subscription Expiry Alert",
    message: `User ${subscriptionData.userName} subscription expires in ${subscriptionData.daysLeft} days. Plan: ${subscriptionData.planName}`,
    link: "/admin/subscriptions",
    data: {
      eventType: "subscription_expiry",
      userId: subscriptionData.userId,
      planName: subscriptionData.planName,
      daysLeft: subscriptionData.daysLeft,
      expiryDate: subscriptionData.expiryDate,
    },
  });
};
