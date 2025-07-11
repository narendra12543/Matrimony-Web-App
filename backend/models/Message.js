import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    },
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'document', 'file'],
    default: 'text'
  },
  file: {
    url: String,
    publicId: String,
    originalName: String,
    format: String,
    resourceType: String,
    size: Number,
    width: Number,
    height: Number
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

messageSchema.index({ chat: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
