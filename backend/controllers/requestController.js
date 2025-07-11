import Request from '../models/requestModel.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Send a connection request
export const sendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, message } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if request already exists
    const existingRequest = await Request.findOne({
      sender: senderId,
      receiver: receiverId
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    // Create new request
    const newRequest = new Request({
      sender: senderId,
      receiver: receiverId,
      message: message || ''
    });

    await newRequest.save();

    // Populate sender info for response
    await newRequest.populate('sender', 'firstName lastName email');
    await newRequest.populate('receiver', 'firstName lastName email');

    logger.info(`Request sent from ${senderId} to ${receiverId}`);
    res.status(201).json({
      message: 'Request sent successfully',
      request: newRequest
    });
  } catch (error) {
    logger.error('Error sending request:', error);
    res.status(500).json({ message: 'Server error while sending request' });
  }
};

// Get all requests for the current user
export const getUserRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get received requests
    const received = await Request.find({
      receiver: userId
    })
      .populate('sender', 'firstName lastName email phone')
      .populate('receiver', 'firstName lastName email')
      .sort({ sentAt: -1 });

    // Get sent requests
    const sent = await Request.find({
      sender: userId
    })
      .populate('sender', 'firstName lastName email')
      .populate('receiver', 'firstName lastName email phone')
      .sort({ sentAt: -1 });

    // Get accepted requests (mutual connections)
    const accepted = await Request.find({
      $or: [
        { sender: userId, status: 'accepted' },
        { receiver: userId, status: 'accepted' }
      ]
    })
      .populate('sender', 'firstName lastName email phone')
      .populate('receiver', 'firstName lastName email phone')
      .sort({ respondedAt: -1 });

    logger.info(`Fetched requests for user ${userId}`);
    res.status(200).json({
      received,
      sent,
      accepted
    });
  } catch (error) {
    logger.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Server error while fetching requests' });
  }
};

// Respond to a request (accept/reject)
export const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user._id;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the receiver
    if (request.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been responded to' });
    }

    // Update request status
    request.status = action === 'accept' ? 'accepted' : 'rejected';
    request.respondedAt = new Date();
    await request.save();

    // Populate for response
    await request.populate('sender', 'firstName lastName email phone');
    await request.populate('receiver', 'firstName lastName email');

    logger.info(`Request ${requestId} ${action}ed by user ${userId}`);
    res.status(200).json({
      message: `Request ${action}ed successfully`,
      request
    });
  } catch (error) {
    logger.error('Error responding to request:', error);
    res.status(500).json({ message: 'Server error while responding to request' });
  }
};

// Get request details
export const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await Request.findById(requestId)
      .populate('sender', 'firstName lastName email phone')
      .populate('receiver', 'firstName lastName email phone');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is involved in this request
    if (request.sender._id.toString() !== userId.toString() &&
      request.receiver._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.status(200).json({ request });
  } catch (error) {
    logger.error('Error fetching request details:', error);
    res.status(500).json({ message: 'Server error while fetching request details' });
  }
}; 