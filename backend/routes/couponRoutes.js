import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import Coupon from '../models/Coupon.js';
import mongoose from 'mongoose';
import User from '../models/User.js'; // <-- Add this import
import Plan from '../models/Plan.js'; // <-- Add this import

const router = express.Router();

// Debug route to test if routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Coupon routes are working', timestamp: new Date().toISOString() });
});

// Create new coupon (Admin only) - TEMP: Remove auth
router.post('/', async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      description,
      applicablePlans,
      usageLimit,
      usageLimitPerUser,
      expiresAt,
      isActive,
      minimumPurchase,
      maximumDiscount
    } = req.body;

    // Validate required fields
    if (!code || !type || !value || !expiresAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate applicablePlans is an array of valid ObjectIds
    if (
      !Array.isArray(applicablePlans) ||
      applicablePlans.length === 0 ||
      !applicablePlans.every(id => mongoose.Types.ObjectId.isValid(id))
    ) {
      return res.status(400).json({ error: "Invalid applicablePlans. Must be array of valid plan IDs." });
    }

    // Optionally, check that all plan IDs exist
    const plans = await Plan.find({ _id: { $in: applicablePlans } });
    if (plans.length !== applicablePlans.length) {
      return res.status(400).json({ error: "Some applicablePlans do not exist." });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }

    // Create new coupon (temp: use dummy admin ID)
    const coupon = new Coupon({
      code: code.toUpperCase(),
      type,
      value,
      description,
      applicablePlans,
      usageLimit,
      usageLimitPerUser,
      expiresAt: new Date(expiresAt),
      isActive,
      minimumPurchase,
      maximumDiscount,
      createdBy: new mongoose.Types.ObjectId() // Temp dummy ID
    });

    await coupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all coupons (Admin only) - TEMP: Remove auth
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10, search } = req.query;
    const query = { deleted: false }; // Only fetch non-deleted coupons

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'active') {
        query.isActive = true;
        query.expiresAt = { $gt: new Date() };
      } else if (status === 'expired') {
        query.expiresAt = { $lt: new Date() };
      } else if (status === 'inactive') {
        query.isActive = false;
      }
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Add search filter
    if (search && search.trim().length > 0) {
      query.$or = [
        { code: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email')
      .populate('applicablePlans', 'name'); // Add this line to populate plan names

    const total = await Coupon.countDocuments(query);

    res.json({
      coupons,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get single coupon by ID (Admin only) - TEMP: Remove auth
router.get('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, deleted: false }).populate('createdBy', 'name email');
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update coupon (Admin only) - TEMP: Remove auth
router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.id, deleted: false },
      { ...req.body, updatedBy: new mongoose.Types.ObjectId() }, // Temp dummy ID
      { new: true, runValidators: true }
    );
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json({ message: 'Coupon updated successfully', coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Soft delete coupon (Admin only) - TEMP: Remove auth
router.delete('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.id, deleted: false },
      { deleted: true },
      { new: true }
    );
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply coupon (User route) - REMOVE requireAdmin, keep authenticate
router.post('/apply', authenticate, async (req, res) => {
  try {
    const { code, planId, originalAmount } = req.body;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user._id;

    // Find coupon
    const coupon = await Coupon.findOne({ code: code?.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({ error: 'Coupon is not active' });
    }

    // Check if coupon has expired
    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    // --- FIX: Robust planId matching for ObjectIds ---
    // If applicablePlans is empty or "all", allow all plans
    if (
      !coupon.applicablePlans ||
      (Array.isArray(coupon.applicablePlans) && coupon.applicablePlans.length === 0)
    ) {
      // Allow all plans
    } else {
      // Compare planId as string with each applicablePlan ObjectId as string
      const planIdStr = planId?.toString();
      const applicablePlansStr = (coupon.applicablePlans || []).map(id => id.toString());
      if (!applicablePlansStr.includes(planIdStr)) {
        return res.status(400).json({ error: 'Coupon not applicable to this plan' });
      }
    }

    // Check minimum purchase requirement
    if (coupon.minimumPurchase && originalAmount < coupon.minimumPurchase) {
      return res.status(400).json({ 
        error: `Minimum purchase amount is ₹${coupon.minimumPurchase}` 
      });
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit exceeded' });
    }

    // Check per-user usage limit
    if (coupon.usageLimitPerUser) {
      const userUsageCount = coupon.redemptions.filter(r => r.userId.toString() === userId.toString()).length;
      if (userUsageCount >= coupon.usageLimitPerUser) {
        return res.status(400).json({ error: 'Personal usage limit exceeded for this coupon' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (originalAmount * coupon.value) / 100;
      if (coupon.maximumDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
      // Special case for 100% discount
      if (coupon.value === 100) {
        discountAmount = originalAmount; // Full discount
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, originalAmount);
      // Special case where fixed discount equals or exceeds price
      if (coupon.value >= originalAmount) {
        discountAmount = originalAmount; // Full discount
      }
    }

    const finalAmount = originalAmount - discountAmount;

    // --- REMOVE: Redemption and user upgrade logic from here ---
    // For 100% discount coupons, DO NOT add redemption or upgrade user here.
    // That should only happen in /coupons/redeem or /subscription/free-upgrade.

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        isFullDiscount: finalAmount === 0 // Flag for frontend
      },
      originalAmount,
      discountAmount,
      finalAmount,
      isFreeUpgrade: finalAmount === 0 // Additional flag to indicate free upgrade
    });
  } catch (error) {
    console.error("[COUPON APPLY] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Redeem coupon (User route) - REMOVE requireAdmin, keep authenticate
router.post('/redeem', authenticate, async (req, res) => {
  try {
    const { code, planId, originalAmount, paymentId } = req.body;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user._id;

    const coupon = await Coupon.findOne({ code: code?.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (originalAmount * coupon.value) / 100;
      if (coupon.maximumDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, originalAmount);
    }

    // Add redemption record
    coupon.redemptions.push({
      userId,
      planId,
      originalAmount,
      discountAmount,
      paymentId,
      redeemedAt: new Date()
    });

    // Increment usage count
    coupon.usageCount += 1;

    await coupon.save();

    res.json({
      message: 'Coupon redeemed successfully',
      discountAmount,
      finalAmount: originalAmount - discountAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate coupon (User route) - REMOVE requireAdmin, keep authenticate
router.post('/validate', authenticate, async (req, res) => {
  try {
    const { code, planId, originalAmount } = req.body;
    const userId = req.user._id;

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({ error: 'Coupon is not active' });
    }

    // Check if coupon has expired
    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    // Check if coupon applies to the selected plan
    if (!coupon.applicablePlans.includes(planId)) {
      return res.status(400).json({ error: 'Coupon not applicable to this plan' });
    }

    // Check minimum purchase requirement
    if (coupon.minimumPurchase && originalAmount < coupon.minimumPurchase) {
      return res.status(400).json({ 
        error: `Minimum purchase amount is ₹${coupon.minimumPurchase}` 
      });
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit exceeded' });
    }

    // Check per-user usage limit
    if (coupon.usageLimitPerUser) {
      const userUsageCount = coupon.redemptions.filter(r => r.userId.toString() === userId.toString()).length;
      if (userUsageCount >= coupon.usageLimitPerUser) {
        return res.status(400).json({ error: 'Personal usage limit exceeded for this coupon' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (originalAmount * coupon.value) / 100;
      if (coupon.maximumDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, originalAmount);
    }

    const finalAmount = originalAmount - discountAmount;

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description
      },
      originalAmount,
      discountAmount,
      finalAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public route: Get active coupons for users (no admin required)
router.get('/public', async (req, res) => {
  try {
    const { planId } = req.query;
    const now = new Date();
    const query = {
      isActive: true,
      expiresAt: { $gt: now }
    };
    if (planId) {
      query.applicablePlans = planId;
    }
    const coupons = await Coupon.find(query).sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
