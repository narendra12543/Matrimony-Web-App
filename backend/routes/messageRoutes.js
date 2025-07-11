// Messaging routes

import express from 'express';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get messages for a chat
router.get('/:chatId', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/', authenticate, async (req, res) => {
  try {
    const { chatId, content, messageType = 'text', file } = req.body;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messageData = {
      chat: chatId,
      sender: req.user._id,
      content,
      messageType
    };

    // Add file data if present
    if (file && file.url) {
      messageData.file = file;
    }

    const message = new Message(messageData);

    await message.save();
    await message.populate('sender', 'firstName lastName avatar');

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Message creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
