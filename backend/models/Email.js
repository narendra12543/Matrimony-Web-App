import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['newsletter', 'recommendation', 'general'],
    default: 'newsletter',
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

export default mongoose.model('Email', emailSchema);