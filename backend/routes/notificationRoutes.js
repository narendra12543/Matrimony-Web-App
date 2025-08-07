import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
  updateNotificationSettings,
} from '../controllers/notificationController.js';

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', authenticate, getNotifications);

// Mark a notification as read
router.patch('/:id/read', authenticate, markAsRead);

// Mark all notifications as read
router.patch('/read-all', authenticate, markAllAsRead);

// Clear all notifications
router.delete('/clear-all', authenticate, clearAllNotifications);

// Delete a single notification
router.delete('/:id', authenticate, deleteNotification);

router.put('/settings', authenticate, updateNotificationSettings);

export default router; 