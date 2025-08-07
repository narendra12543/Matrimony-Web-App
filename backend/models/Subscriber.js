import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Test User' },
  dob: { type: Date },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  subscriptions: {
    newsletter: { type: Boolean, default: true },
    dailyRecommendations: { type: Boolean, default: true },
    platformUpdates: { type: Boolean, default: true },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'unverified', 'pending_verification'],
    default: 'unverified',
  },
  profileCompletion: { type: Number, default: 100, min: 0, max: 100 },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Subscriber', subscriberSchema);