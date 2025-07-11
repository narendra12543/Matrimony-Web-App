import Plan from '../models/Plan.js';
import User from '../models/User.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import dotenv from "dotenv"
dotenv.config()
import mongoose from 'mongoose';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ||"rzp_test_Nib0mJvpfJr98Q",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "UyFPAWHj1GljEQDCBpxC2a40",
});
console.log(razorpay);


export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    logger.error('Failed to fetch plans', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
};

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    
    const { planId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const plan = await Plan.findById(planId).session(session);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const options = {
      amount: plan.price * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        planId: plan._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);
    
    await session.commitTransaction();
    res.json({ 
      orderId: order.id, 
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Order creation failed', {
      error: err,
      message: err?.message,
      stack: err?.stack,
      full: JSON.stringify(err, Object.getOwnPropertyNames(err))
    });
    res.status(500).json({ error: 'Failed to create payment order' });
  } finally {
    session.endSession();
  }
};

export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    
    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update user subscription
    const plan = await Plan.findById(planId).session(session);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      subscription: {
        isActive: true,
        plan: plan._id,
        planName: plan.name,
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    }, { session });

    await session.commitTransaction();
    res.json({ success: true, message: 'Payment verified and subscription activated' });
  } catch (err) {
    await session.abortTransaction();
    logger.error('Payment verification failed', { error: err.message });
    res.status(500).json({ error: 'Payment verification failed' });
  } finally {
    session.endSession();
  }
};