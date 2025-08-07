import { notifySuspiciousActivity } from "../services/adminNotificationService.js";
import User from "../models/User.js";

// Track user activities for suspicious behavior detection
const userActivityMap = new Map();

// Suspicious activity detection middleware
export const detectSuspiciousActivity = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return next();
    }

    const currentTime = Date.now();
    const userKey = userId.toString();

    // Get or initialize user activity tracking
    if (!userActivityMap.has(userKey)) {
      userActivityMap.set(userKey, {
        loginAttempts: [],
        failedRequests: [],
        suspiciousActions: [],
        lastActivity: currentTime,
      });
    }

    const userActivity = userActivityMap.get(userKey);
    userActivity.lastActivity = currentTime;

    // Detect suspicious patterns
    const suspiciousPatterns = [];

    // 1. Multiple failed login attempts
    if (req.path.includes("/auth/login") && res.statusCode === 401) {
      userActivity.failedRequests.push(currentTime);

      // Check for multiple failed attempts in short time
      const recentFailures = userActivity.failedRequests.filter(
        (time) => currentTime - time < 5 * 60 * 1000 // 5 minutes
      );

      if (recentFailures.length >= 5) {
        suspiciousPatterns.push({
          type: "multiple_failed_logins",
          description: "Multiple failed login attempts detected",
          severity: "high",
          details: `${recentFailures.length} failed attempts in 5 minutes`,
        });
      }
    }

    // 2. Rapid API requests (potential abuse)
    const recentRequests = userActivity.failedRequests.filter(
      (time) => currentTime - time < 60 * 1000 // 1 minute
    );

    if (recentRequests.length >= 20) {
      suspiciousPatterns.push({
        type: "rapid_api_requests",
        description: "Unusually high number of API requests",
        severity: "medium",
        details: `${recentRequests.length} requests in 1 minute`,
      });
    }

    // 3. Suspicious profile changes
    if (req.path.includes("/users/profile") && req.method === "PUT") {
      const changes = req.body;
      const suspiciousChanges = [];

      // Check for suspicious profile modifications
      if (changes.email && !changes.email.includes("@")) {
        suspiciousChanges.push("Invalid email format");
      }

      if (changes.phone && changes.phone.length < 10) {
        suspiciousChanges.push("Invalid phone number");
      }

      if (changes.dateOfBirth) {
        const age =
          new Date().getFullYear() -
          new Date(changes.dateOfBirth).getFullYear();
        if (age < 18 || age > 100) {
          suspiciousChanges.push("Suspicious age");
        }
      }

      if (suspiciousChanges.length > 0) {
        suspiciousPatterns.push({
          type: "suspicious_profile_changes",
          description: "Suspicious profile modifications detected",
          severity: "medium",
          details: suspiciousChanges.join(", "),
        });
      }
    }

    // 4. Unusual payment patterns
    if (req.path.includes("/subscription") && req.method === "POST") {
      const paymentData = req.body;

      if (paymentData.amount && paymentData.amount > 10000) {
        suspiciousPatterns.push({
          type: "high_value_payment",
          description: "Unusually high payment amount",
          severity: "medium",
          details: `Payment amount: ${paymentData.amount}`,
        });
      }
    }

    // Send admin notifications for suspicious activities
    if (suspiciousPatterns.length > 0) {
      try {
        const user = await User.findById(userId);
        if (user) {
          for (const pattern of suspiciousPatterns) {
            await notifySuspiciousActivity({
              userId: userId,
              userName: `${user.firstName} ${user.lastName}`,
              userEmail: user.email,
              activityType: pattern.type,
              description: pattern.description,
              severity: pattern.severity,
              details: pattern.details,
            });
          }
        }
      } catch (notificationError) {
        console.error(
          "Error sending suspicious activity notification:",
          notificationError
        );
      }
    }

    // Clean up old activity data (older than 1 hour)
    const oneHourAgo = currentTime - 60 * 60 * 1000;
    userActivity.failedRequests = userActivity.failedRequests.filter(
      (time) => time > oneHourAgo
    );
    userActivity.suspiciousActions = userActivity.suspiciousActions.filter(
      (time) => time > oneHourAgo
    );

    next();
  } catch (error) {
    console.error("Error in suspicious activity detection:", error);
    next();
  }
};

// Clean up old user activity data periodically
setInterval(() => {
  const currentTime = Date.now();
  const oneHourAgo = currentTime - 60 * 60 * 1000;

  for (const [userKey, activity] of userActivityMap.entries()) {
    if (activity.lastActivity < oneHourAgo) {
      userActivityMap.delete(userKey);
    }
  }
}, 30 * 60 * 1000); // Clean up every 30 minutes
