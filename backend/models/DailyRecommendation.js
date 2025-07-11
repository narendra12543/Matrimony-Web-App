import mongoose from "mongoose";

const dailyRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recommendedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchScore: {
      type: Number,
      required: true,
    },
    matchPercentage: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isViewed: {
      type: Boolean,
      default: false,
    },
    isSkipped: {
      type: Boolean,
      default: false,
    },
    isLiked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one recommendation per user per day
dailyRecommendationSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyRecommendation = mongoose.model("DailyRecommendation", dailyRecommendationSchema);

export default DailyRecommendation; 