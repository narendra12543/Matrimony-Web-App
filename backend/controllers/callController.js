// Call handling

import callService from '../services/callService.js';
import logger from '../utils/logger.js';

class CallController {
  // Initiate a new call
  async initiateCall(req, res) {
    try {
      const { receiverId, callType = 'video', quality = 'medium' } = req.body;
      const callerId = req.user.id;

      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID is required'
        });
      }

      const result = await callService.initiateCall(callerId, receiverId, callType, quality);

      res.status(201).json({
        success: true,
        message: 'Call initiated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in initiateCall controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initiate call'
      });
    }
  }

  // Answer a call
  async answerCall(req, res) {
    try {
      const { callId } = req.params;
      const receiverId = req.user.id;

      if (!callId) {
        return res.status(400).json({
          success: false,
          message: 'Call ID is required'
        });
      }

      const result = await callService.answerCall(callId, receiverId);

      res.status(200).json({
        success: true,
        message: 'Call answered successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in answerCall controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to answer call'
      });
    }
  }

  // Reject a call
  async rejectCall(req, res) {
    try {
      const { callId } = req.params;
      const { reason } = req.body;
      const receiverId = req.user.id;

      if (!callId) {
        return res.status(400).json({
          success: false,
          message: 'Call ID is required'
        });
      }

      const result = await callService.rejectCall(callId, receiverId, reason);

      res.status(200).json({
        success: true,
        message: 'Call rejected successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in rejectCall controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject call'
      });
    }
  }

  // End a call
  async endCall(req, res) {
    try {
      const { callId } = req.params;
      const userId = req.user.id;

      if (!callId) {
        return res.status(400).json({
          success: false,
          message: 'Call ID is required'
        });
      }

      const result = await callService.endCall(callId, userId);

      res.status(200).json({
        success: true,
        message: 'Call ended successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in endCall controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to end call'
      });
    }
  }

  // Get call history
  async getCallHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await callService.getCallHistory(userId, parseInt(page), parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Call history retrieved successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in getCallHistory controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get call history'
      });
    }
  }

  // Get active calls
  async getActiveCalls(req, res) {
    try {
      const calls = await callService.getActiveCalls();

      res.status(200).json({
        success: true,
        message: 'Active calls retrieved successfully',
        data: calls
      });

    } catch (error) {
      logger.error('Error in getActiveCalls controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get active calls'
      });
    }
  }

  // Check user availability
  async checkUserAvailability(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const isAvailable = await callService.checkUserAvailability(userId);

      res.status(200).json({
        success: true,
        message: 'User availability checked successfully',
        data: {
          userId,
          isAvailable
        }
      });

    } catch (error) {
      logger.error('Error in checkUserAvailability controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check user availability'
      });
    }
  }

  // Update call quality
  async updateCallQuality(req, res) {
    try {
      const { callId } = req.params;
      const { qualityMetrics } = req.body;

      if (!callId || !qualityMetrics) {
        return res.status(400).json({
          success: false,
          message: 'Call ID and quality metrics are required'
        });
      }

      const result = await callService.updateCallQuality(callId, qualityMetrics);

      res.status(200).json({
        success: true,
        message: 'Call quality updated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in updateCallQuality controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update call quality'
      });
    }
  }

  // Get call statistics
  async getCallStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query;

      const stats = await callService.getCallStats(userId, period);

      res.status(200).json({
        success: true,
        message: 'Call statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      logger.error('Error in getCallStats controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get call statistics'
      });
    }
  }

  // Get call details
  async getCallDetails(req, res) {
    try {
      const { callId } = req.params;
      const userId = req.user.id;

      if (!callId) {
        return res.status(400).json({
          success: false,
          message: 'Call ID is required'
        });
      }

      const Call = (await import('../models/Call.js')).default;
      const call = await Call.findById(callId)
        .populate('caller', 'name email profilePicture')
        .populate('receiver', 'name email profilePicture');

      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Call not found'
        });
      }

      // Check if user is part of the call
      if (call.caller._id.toString() !== userId && call.receiver._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to view this call'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Call details retrieved successfully',
        data: call
      });

    } catch (error) {
      logger.error('Error in getCallDetails controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get call details'
      });
    }
  }

  // Handle WebRTC signaling
  async handleSignaling(req, res) {
    try {
      const { roomId, signalType, signalData } = req.body;
      const userId = req.user.id;

      if (!roomId || !signalType || !signalData) {
        return res.status(400).json({
          success: false,
          message: 'Room ID, signal type, and signal data are required'
        });
      }

      const result = await callService.handleSignaling(roomId, userId, signalType, signalData);

      res.status(200).json({
        success: true,
        message: 'Signaling handled successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in handleSignaling controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to handle signaling'
      });
    }
  }

  // Get ICE servers configuration
  async getIceServers(req, res) {
    try {
      const webrtcUtils = (await import('../utils/webrtc.js')).default;
      const iceServers = webrtcUtils.getIceServers();

      res.status(200).json({
        success: true,
        message: 'ICE servers configuration retrieved successfully',
        data: {
          iceServers
        }
      });

    } catch (error) {
      logger.error('Error in getIceServers controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get ICE servers'
      });
    }
  }

  // Clean up expired calls (admin only)
  async cleanupExpiredCalls(req, res) {
    try {
      await callService.cleanupExpiredCalls();

      res.status(200).json({
        success: true,
        message: 'Expired calls cleaned up successfully'
      });

    } catch (error) {
      logger.error('Error in cleanupExpiredCalls controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cleanup expired calls'
      });
    }
  }
}

export default new CallController();
