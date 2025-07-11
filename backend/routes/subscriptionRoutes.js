import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getPlans,
  createOrder,
  verifyPayment
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

export default router;