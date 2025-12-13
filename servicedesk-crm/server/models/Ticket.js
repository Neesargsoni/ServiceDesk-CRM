import mongoose from "mongoose";

// Activity Timeline Schema
const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  userName: { type: String, required: true },
  action: { type: String, required: true }, // "created", "updated_status", "commented", etc.
  details: { type: String }, // Additional info about the action
  timestamp: { type: Date, default: Date.now }
});

// Comment Schema
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  userName: { type: String, required: true },
  userRole: { type: String }, // To show if comment is from agent/admin
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Low"
  },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved", "Closed"],
    default: "Open"
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },
  comments: [commentSchema],
  activity: [activitySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to update timestamp on save
ticketSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Ticket", ticketSchema);