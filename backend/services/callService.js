// Call management

import Call from '../models/Call.js';
import User from '../models/User.js';
import webrtcUtils from '../utils/webrtc.js';
import logger from '../utils/logger.js';

class CallService {
  constructor() {
    this.activeCalls = new Map(); // Store active call sessions
  }

  // Initialize a new call
  async initiateCall(callerId, receiverId, callType = 'video', quality = 'medium', roomIdFromClient = null) {
    try {
      // Validate users exist
      const [caller, receiver] = await Promise.all([
        User.findById(callerId),
        User.findById(receiverId)
      ]);

      if (!caller || !receiver) {
        throw new Error('User not found');
      }

      // Check if receiver is available
      const isReceiverAvailable = await this.checkUserAvailability(receiverId);
      if (!isReceiverAvailable) {
        throw new Error('User is not available for calls');
      }

      // Use frontend-provided roomId if available, else generate one
      let roomId = roomIdFromClient;
      if (!roomId) {
        roomId = `${callerId}_${receiverId}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      }
      const sessionId = webrtcUtils.generateSessionId();

      // Create call record with roomId
      const call = new Call({
        caller: callerId,
        receiver: receiverId,
        callType,
        status: 'initiated',
        connectionDetails: {
          roomId,
          sessionId,
          iceServers: webrtcUtils.getIceServers()
        },
        quality: {
          videoQuality: callType === 'video' ? quality : 'none',
          audioQuality: quality
        },
        deviceInfo: {
          callerDevice: 'web',
          receiverDevice: 'web'
        }
      });

      await call.save();
      await call.addLog('call_initiated', `Call initiated by ${caller.name || caller.email}`);

      // Store active call session
      this.activeCalls.set(roomId, {
        callId: call._id,
        caller: callerId,
        receiver: receiverId,
        status: 'initiated',
        startTime: new Date()
      });

      return {
        success: true,
        call: call,
        roomId,
        sessionId,
        iceServers: webrtcUtils.getIceServers()
      };

    } catch (error) {
      logger.error('Error initiating call:', error);
      throw error;
    }
  }

  // Answer a call
  async answerCall(callId, receiverId) {
    try {
      const call = await Call.findById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      if (call.receiver.toString() !== receiverId) {
        throw new Error('Unauthorized to answer this call');
      }

      // Allow answering if status is 'initiated' or 'ringing'
      if (!['initiated', 'ringing'].includes(call.status)) {
        throw new Error('Call is not in a state that can be answered');
      }

      call.status = 'answered';
      await call.save();
      await call.addLog('call_answered', 'Call was answered');

      // Update active call session
      const activeCall = this.activeCalls.get(call.connectionDetails.roomId);
      if (activeCall) {
        activeCall.status = 'answered';
        this.activeCalls.set(call.connectionDetails.roomId, activeCall);
      }

      return {
        success: true,
        call,
        roomId: call.connectionDetails.roomId
      };

    } catch (error) {
      logger.error('Error answering call:', error);
      throw error;
    }
  }

  // Reject a call
  async rejectCall(callId, receiverId, reason = 'rejected') {
    try {
      const call = await Call.findById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      if (call.receiver.toString() !== receiverId) {
        throw new Error('Unauthorized to reject this call');
      }

      call.status = 'rejected';
      call.outcome = 'failed';
      await call.save();
      await call.addLog('call_rejected', `Call rejected: ${reason}`);

      // Remove from active calls
      if (call.connectionDetails && call.connectionDetails.roomId) {
        this.activeCalls.delete(call.connectionDetails.roomId);
      }

      return {
        success: true,
        call
      };

    } catch (error) {
      logger.error('Error rejecting call:', error);
      throw error;
    }
  }

  // End a call
  async endCall(callId, userId) {
    try {
      const call = await Call.findById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      // Check if user is part of the call
      if (call.caller.toString() !== userId && call.receiver.toString() !== userId) {
        throw new Error('Unauthorized to end this call');
      }

      // Only end if not already ended
      if (call.status !== 'ended') {
        await call.endCall();
        await call.addLog('call_ended', `Call ended by user ${userId}`);
      }

      // Remove from active calls
      if (call.connectionDetails && call.connectionDetails.roomId) {
        this.activeCalls.delete(call.connectionDetails.roomId);
      }

      return {
        success: true,
        call
      };

    } catch (error) {
      logger.error('Error ending call:', error);
      throw error;
    }
  }

  // Get call history for a user
  async getCallHistory(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const calls = await Call.find({
        $or: [{ caller: userId }, { receiver: userId }]
      })
      .populate('caller', 'name email profilePicture')
      .populate('receiver', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      const total = await Call.countDocuments({
        $or: [{ caller: userId }, { receiver: userId }]
      });

      return {
        calls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Error getting call history:', error);
      throw error;
    }
  }

  // Get active calls
  async getActiveCalls() {
    try {
      const calls = await Call.find({
        status: { $in: ['initiated', 'ringing', 'answered'] }
      })
      .populate('caller', 'name email profilePicture')
      .populate('receiver', 'name email profilePicture');

      return calls;

    } catch (error) {
      logger.error('Error getting active calls:', error);
      throw error;
    }
  }

  // Check if user is available for calls
  async checkUserAvailability(userId) {
    // For testing: always return true (user is available)
    return true;
  }

  // Update call quality metrics
  async updateCallQuality(callId, qualityMetrics) {
    try {
      const call = await Call.findById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      const quality = webrtcUtils.determineCallQuality(qualityMetrics);
      
      call.quality = {
        videoQuality: quality.videoQuality,
        audioQuality: quality.audioQuality
      };

      await call.save();
      await call.addLog('quality_changed', `Quality updated: ${quality.overallQuality}`);

      return {
        success: true,
        quality
      };

    } catch (error) {
      logger.error('Error updating call quality:', error);
      throw error;
    }
  }

  // Handle WebRTC signaling
  async handleSignaling(roomId, userId, signalType, signalData) {
    try {
      const activeCall = this.activeCalls.get(roomId);
      if (!activeCall) {
        throw new Error('No active call found for this room');
      }

      // Validate signal data
      if (!webrtcUtils.validateSDP(signalData)) {
        throw new Error('Invalid SDP data');
      }

      // Process signal based on type
      switch (signalType) {
        case 'offer':
          return this.handleOffer(roomId, userId, signalData);
        case 'answer':
          return this.handleAnswer(roomId, userId, signalData);
        case 'ice-candidate':
          return this.handleIceCandidate(roomId, userId, signalData);
        default:
          throw new Error('Unknown signal type');
      }

    } catch (error) {
      logger.error('Error handling signaling:', error);
      throw error;
    }
  }

  // Handle WebRTC offer
  async handleOffer(roomId, userId, offer) {
    const activeCall = this.activeCalls.get(roomId);
    if (activeCall.caller.toString() !== userId) {
      throw new Error('Only caller can send offer');
    }

    return {
      type: 'offer',
      data: offer,
      from: userId,
      roomId
    };
  }

  // Handle WebRTC answer
  async handleAnswer(roomId, userId, answer) {
    const activeCall = this.activeCalls.get(roomId);
    if (activeCall.receiver.toString() !== userId) {
      throw new Error('Only receiver can send answer');
    }

    return {
      type: 'answer',
      data: answer,
      from: userId,
      roomId
    };
  }

  // Handle ICE candidate
  async handleIceCandidate(roomId, userId, candidate) {
    const activeCall = this.activeCalls.get(roomId);
    if (activeCall.caller.toString() !== userId && activeCall.receiver.toString() !== userId) {
      throw new Error('Unauthorized ICE candidate');
    }

    return {
      type: 'ice-candidate',
      data: candidate,
      from: userId,
      roomId
    };
  }

  // Get call statistics
  async getCallStats(userId, period = '30d') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      const stats = await Call.aggregate([
        {
          $match: {
            $or: [{ caller: userId }, { receiver: userId }],
            createdAt: dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            totalDuration: { $sum: '$duration' },
            answeredCalls: {
              $sum: { $cond: [{ $eq: ['$status', 'answered'] }, 1, 0] }
            },
            missedCalls: {
              $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
            },
            videoCalls: {
              $sum: { $cond: [{ $eq: ['$callType', 'video'] }, 1, 0] }
            },
            voiceCalls: {
              $sum: { $cond: [{ $eq: ['$callType', 'voice'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalCalls: 0,
        totalDuration: 0,
        answeredCalls: 0,
        missedCalls: 0,
        videoCalls: 0,
        voiceCalls: 0
      };

    } catch (error) {
      logger.error('Error getting call stats:', error);
      throw error;
    }
  }

  // Helper method to get date filter
  getDateFilter(period) {
    const now = new Date();
    let startDate;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { $gte: startDate };
  }

  // Clean up expired calls
  async cleanupExpiredCalls() {
    try {
      const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const expiredCalls = await Call.find({
        status: { $in: ['initiated', 'ringing'] },
        createdAt: { $lt: expiredTime }
      });

      for (const call of expiredCalls) {
        call.status = 'missed';
        call.outcome = 'no_answer';
        await call.save();
        await call.addLog('call_missed', 'Call expired and marked as missed');
      }

      logger.info(`Cleaned up ${expiredCalls.length} expired calls`);

    } catch (error) {
      logger.error('Error cleaning up expired calls:', error);
    }
  }
}

export default new CallService();
