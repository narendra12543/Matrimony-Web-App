import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
requestSchema.index({ sender: 1, receiver: 1 });
requestSchema.index({ receiver: 1, status: 1 });
requestSchema.index({ sender: 1, status: 1 });

const Request = mongoose.model('Request', requestSchema);
export default Request; 