import mongoose from 'mongoose';

const redemptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  originalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  redeemedAt: {
    type: Date,
    default: Date.now
  }
});

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  applicablePlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  }],
  usageLimit: {
    type: Number,
    min: 1
  },
  usageLimitPerUser: {
    type: Number,
    default: 1,
    min: 1
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  minimumPurchase: {
    type: Number,
    min: 0
  },
  maximumDiscount: {
    type: Number,
    min: 0
  },
  redemptions: [redemptionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false // TEMP: Made optional
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ type: 1 });

// Virtual to check if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual to check if coupon is valid
couponSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired && 
         (!this.usageLimit || this.usageCount < this.usageLimit);
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
