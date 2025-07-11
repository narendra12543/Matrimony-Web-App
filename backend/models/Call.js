import mongoose from 'mongoose';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const CallSchema = new mongoose.Schema({
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  callType: { type: String, enum: ['video', 'voice'], required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number }, // in seconds
  status: {
    type: String,
    enum: ['initiated', 'ongoing', 'missed', 'completed', 'rejected'],
    default: 'initiated'
  },
  connectionDetails: {
    roomId: { type: String, required: true },
    // Add other connection details if needed
  },
}, { timestamps: true });

CallSchema.index({ 'connectionDetails.roomId': 1 }, { unique: true });

// Pre-save hook to guarantee roomId is always set
CallSchema.pre('validate', function(next) {
  if (!this.connectionDetails) this.connectionDetails = {};
  if (!this.connectionDetails.roomId) {
    this.connectionDetails.roomId = uuidv4();
  }
  next();
});

export default mongoose.model('Call', CallSchema);
