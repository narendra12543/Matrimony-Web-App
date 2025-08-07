import mongoose from "mongoose";

const idCounterSchema = new mongoose.Schema(
  {
    currentId: {
      type: Number,
      default: 1000,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const IdCounter = mongoose.model("IdCounter", idCounterSchema);

export default IdCounter;
