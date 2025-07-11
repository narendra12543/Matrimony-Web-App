import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    maxlength: 50
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  features: [{ 
    type: String, 
    required: true,
    trim: true
  }],
  duration: {
    type: Number,
    default: 30, // days
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

planSchema.index({ price: 1 });
planSchema.index({ isActive: 1 });

const Plan = mongoose.model('Plan', planSchema);
export default Plan;