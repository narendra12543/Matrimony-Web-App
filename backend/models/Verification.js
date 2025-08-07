import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema({
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscriber",
    required: true,
  },
  documentType: {
    type: String,
    required: true,
    enum: ["Aadhaar Card", "Passport", "Driver's License"],
  },
  documentFrontPath: { type: String, required: true },
  documentBackPath: { type: String },
  status: {
    type: String,
    enum: ["pending_review", "auto_approved", "approved", "rejected"],
    default: "pending_review",
  },
  vulnerabilityScore: {
    type: Number,
    required: true,
  },
  extractedData: {
    type: Map,
    of: String,
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  adminNotes: { type: String },
});

export default mongoose.model("Verification", verificationSchema);
