import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['newsletter', 'recommendation', 'general'],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
  }],
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

// Using 'EmailM' as the model name to avoid conflicts
export default mongoose.model('EmailM', emailSchema);
