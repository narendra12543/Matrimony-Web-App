import Request from "../models/requestModel.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { createNotification } from "../services/notificationService.js";

// Send a connection request
export const sendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, message } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request already exists
    const existingRequest = await Request.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (existingRequest) {
      logger.warn(
        `Duplicate request attempt from ${senderId} to ${receiverId}`
      );
      return res.status(400).json({ message: "Request already sent" });
    }

    // Create new request
    const newRequest = new Request({
      sender: senderId,
      receiver: receiverId,
      message: message || "",
    });

    await newRequest.save();

    // Increment the connection request count and save the user, then create a notification
    const senderUser = await User.findById(senderId);
    if (senderUser) {
      senderUser.connectionRequestsThisWeek =
        (senderUser.connectionRequestsThisWeek || 0) + 1;
      await senderUser.save();

      // Create a notification for the receiver
      await createNotification({
        user: receiverId,
        type: "new_request",
        title: "New Connection Request!",
        message: `${senderUser.firstName} ${senderUser.lastName} has sent you a connection request.`, // Use sender's name
        link: "/dashboard", // Link to the dashboard or requests section
      });
      logger.info(
        `Notification created for ${receiverId} about new request from ${senderId}`
      );
    }

    // Populate sender info for response
    await newRequest.populate("sender", "firstName lastName email photos");
    await newRequest.populate("receiver", "firstName lastName email photos");

    const remainingRequests =
      req.requestLimit - senderUser.connectionRequestsThisWeek;

    logger.info(`Request sent from ${senderId} to ${receiverId}`);
    res.status(201).json({
      message: "Request sent successfully",
      request: newRequest,
      remainingRequests,
    });
  } catch (error) {
    logger.error("Error sending request:", error);
    res.status(500).json({ message: "Server error while sending request" });
  }
};

// Get all requests for the current user
export const getUserRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get received requests
    const received = await Request.find({
      receiver: userId,
    })
      .populate("sender", "firstName lastName email phone photos")
      .populate("receiver", "firstName lastName email photos")
      .sort({ sentAt: -1 });

    // Get sent requests
    const sent = await Request.find({
      sender: userId,
    })
      .populate("sender", "firstName lastName email photos")
      .populate("receiver", "firstName lastName email phone photos")
      .sort({ sentAt: -1 });

    // Get accepted requests (mutual connections)
    const accepted = await Request.find({
      $or: [
        { sender: userId, status: "accepted" },
        { receiver: userId, status: "accepted" },
      ],
    })
      .populate("sender", "firstName lastName email phone photos")
      .populate("receiver", "firstName lastName email phone photos")
      .sort({ respondedAt: -1 });

    logger.info(`Fetched requests for user ${userId}`);
    res.status(200).json({
      received,
      sent,
      accepted,
    });
  } catch (error) {
    logger.error("Error fetching requests:", error);
    res.status(500).json({ message: "Server error while fetching requests" });
  }
};

// Respond to a request (accept/reject)
export const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user._id;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user is the receiver
    if (request.receiver.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to respond to this request" });
    }

    // Check if request is still pending
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Request has already been responded to" });
    }

    // Update request status
    request.status = action === "accept" ? "accepted" : "rejected";
    request.respondedAt = new Date();
    await request.save();

    // If accepted, create a notification for the sender
    if (action === "accept") {
      await createNotification({
        user: request.sender,
        type: "interest_accepted",
        title: "Interest Request Accepted",
        message: `Your interest request to ${req.user.firstName} has been accepted!`,
        fromUser: userId,
        link: `/profile/${userId}`,
      });
    } else if (action === "reject") {
      await createNotification({
        user: request.sender,
        type: "interest_rejected",
        title: "Interest Request Rejected",
        message: `Your interest request to ${req.user.firstName} has been rejected.`, // Use receiver's name
        fromUser: userId,
        link: `/profile/${userId}`,
      });
    }

    // Populate for response
    await request.populate("sender", "firstName lastName email phone photos");
    await request.populate("receiver", "firstName lastName email photos");

    logger.info(`Request ${requestId} ${action}ed by user ${userId}`);
    res.status(200).json({
      message: `Request ${action}ed successfully`,
      request,
    });
  } catch (error) {
    logger.error("Error responding to request:", error);
    res
      .status(500)
      .json({ message: "Server error while responding to request" });
  }
};

// Get request details
export const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await Request.findById(requestId)
      .populate("sender", "firstName lastName email phone photos")
      .populate("receiver", "firstName lastName email phone photos");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user is involved in this request
    if (
      request.sender._id.toString() !== userId.toString() &&
      request.receiver._id.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this request" });
    }

    res.status(200).json({ request });
  } catch (error) {
    logger.error("Error fetching request details:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching request details" });
  }
};

// Cancel a sent request
export const cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user is the sender
    if (request.sender.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this request" });
    }

    // Check if request is still pending
    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Cannot cancel a request that has already been responded to",
      });
    }

    await request.deleteOne();

    // Decrement the connection request count
    const senderUser = await User.findById(userId);
    if (senderUser) {
      senderUser.connectionRequestsThisWeek = Math.max(
        0,
        (senderUser.connectionRequestsThisWeek || 0) - 1
      );
      await senderUser.save();
    }

    // Create a notification for the receiver that the request was cancelled
    const receiverUser = await User.findById(request.receiver);
    if (receiverUser) {
      await createNotification({
        user: request.receiver,
        type: "request_cancelled",
        title: "Connection Request Cancelled",
        message: `${req.user.firstName} ${req.user.lastName} has cancelled their connection request.`, // Use sender's name
        fromUser: userId,
        link: "/dashboard",
      });
    }

    logger.info(`Request ${requestId} cancelled by user ${userId}`);
    res.status(200).json({ message: "Request cancelled successfully" });
  } catch (error) {
    logger.error("Error cancelling request:", error);
    res.status(500).json({ message: "Server error while cancelling request" });
  }
};
