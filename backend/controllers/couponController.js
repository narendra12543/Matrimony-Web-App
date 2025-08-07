import mongoose from 'mongoose';
import Plan from '../models/Plan.js';
import Coupon from '../models/Coupon.js';
import logger from '../utils/logger.js';

// Create new coupon
export const createCoupon = async (req, res) => {
  try {
    const { code, type, value, expiryDate, usageLimit, applicablePlans } = req.body;

    // --- Robust validations ---
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ error: "Coupon code is required and must be a non-empty string." });
    }
    if (typeof type !== 'string' || (type !== 'percentage' && type !== 'flat')) {
      return res.status(400).json({ error: "Coupon type must be either 'percentage' or 'flat'." });
    }
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      return res.status(400).json({ error: "Coupon value must be a positive number." });
    }
    if (expiryDate && isNaN(new Date(expiryDate).getTime())) {
      return res.status(400).json({ error: "Invalid expiry date." });
    }
    if (usageLimit !== undefined && (typeof usageLimit !== 'number' || isNaN(usageLimit) || usageLimit < 0)) {
      return res.status(400).json({ error: "Usage limit must be a non-negative number." });
    }

    // Check if plans are valid ObjectIds
    if (
      !Array.isArray(applicablePlans) ||
      applicablePlans.length === 0 ||
      !applicablePlans.every(id => mongoose.Types.ObjectId.isValid(id))
    ) {
      return res.status(400).json({ error: "Invalid applicablePlans. Must be array of valid plan IDs." });
    }
    const plans = await Plan.find({ _id: { $in: applicablePlans } });
    if (plans.length !== applicablePlans.length) {
      return res.status(400).json({ error: "Some applicablePlans do not exist." });
    }

    const coupon = new Coupon({
      code,
      type,
      value,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usageLimit,
      applicablePlans,
      createdBy: req.user._id
    });
    await coupon.save();
    res.status(201).json({ message: "Coupon created", coupon });
  } catch (err) {
    logger.error('Coupon creation error:', err);
    res.status(500).json({ error: "Failed to create coupon" });
  }
};

// Update coupon
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, type, value, expiryDate, usageLimit, applicablePlans } = req.body;

    // --- Robust validations ---
    if (code && (typeof code !== 'string' || code.trim().length === 0)) {
      return res.status(400).json({ error: "Coupon code must be a non-empty string." });
    }
    if (type && (typeof type !== 'string' || (type !== 'percentage' && type !== 'flat'))) {
      return res.status(400).json({ error: "Coupon type must be either 'percentage' or 'flat'." });
    }
    if (value && (typeof value !== 'number' || isNaN(value) || value <= 0)) {
      return res.status(400).json({ error: "Coupon value must be a positive number." });
    }
    if (expiryDate && isNaN(new Date(expiryDate).getTime())) {
      return res.status(400).json({ error: "Invalid expiry date." });
    }
    if (usageLimit !== undefined && (typeof usageLimit !== 'number' || isNaN(usageLimit) || usageLimit < 0)) {
      return res.status(400).json({ error: "Usage limit must be a non-negative number." });
    }

    // Check if plans are valid ObjectIds
    if (
      applicablePlans &&
      (!Array.isArray(applicablePlans) || 
      !applicablePlans.every(id => mongoose.Types.ObjectId.isValid(id)))
    ) {
      return res.status(400).json({ error: "Invalid applicablePlans. Must be array of valid plan IDs." });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      {
        code,
        type,
        value,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageLimit,
        applicablePlans,
      },
      { new: true }
    );
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });
    res.json({ message: "Coupon updated", coupon });
  } catch (err) {
    logger.error('Coupon update error:', err);
    res.status(500).json({ error: "Failed to update coupon" });
  }
};

// Delete coupon
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    logger.error('Coupon delete error:', err);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
};