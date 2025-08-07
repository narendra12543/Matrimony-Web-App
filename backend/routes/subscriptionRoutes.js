import express from 'express';

import rateLimit from 'express-rate-limit';
import {
  getPlans,
  createOrder,
  verifyPayment,
  freeUpgrade
} from '../controllers/subscriptionController.js';
import { authenticate, requireUser } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many payment attempts, please try again later'
});

// Routes
router.get('/plans', getPlans);
router.post('/payment/order', authenticate, requireUser, paymentLimiter, createOrder);
router.post('/payment/verify', authenticate, requireUser, paymentLimiter, verifyPayment);
// Add to your subscription routes
router.post('/free-upgrade', authenticate,requireUser, freeUpgrade);

export default router;