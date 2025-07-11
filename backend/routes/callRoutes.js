// Call routes

import express from 'express';
import Call from '../models/Call.js';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Get all call history for the authenticated user
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const calls = await Call.find({
      $or: [
        { caller: userId },
        { receiver: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('caller', 'firstName lastName avatar')
      .populate('receiver', 'firstName lastName avatar');
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// Get missed calls for the authenticated user
router.get('/missed', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const calls = await Call.find({
      receiver: userId,
      status: 'missed'
    })
      .sort({ createdAt: -1 })
      .populate('caller', 'firstName lastName avatar');
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch missed calls' });
  }
});

// Log a new call or update call status
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiver, callType, startTime, endTime, duration, status, callId } = req.body;
    let call;
    if (callId) {
      // Update existing call
      call = await Call.findByIdAndUpdate(
        callId,
        { endTime, duration, status },
        { new: true }
      );
    } else {
      // Create new call
      let connectionDetails = req.body.connectionDetails || {};
      if (!connectionDetails.roomId) {
        try {
          connectionDetails.roomId = crypto.randomBytes(16).toString('hex');
        } catch (e) {
          connectionDetails.roomId = `${req.user._id}_${receiver}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
        }
      }
      call = new Call({
        caller: req.user._id,
        receiver,
        callType,
        startTime,
        endTime,
        duration,
        status,
        connectionDetails
      });
      console.log('Saving new Call:', call); // Debug log
      await call.save();
    }
    res.json(call);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log/update call' });
  }
});

export default router;
