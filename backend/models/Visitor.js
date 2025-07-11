import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  visitedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  visitorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  visitedAt: {
    type: Date,
    default: Date.now
  }
});

const Visitor = mongoose.model("Visitor", visitorSchema);
export default Visitor;
