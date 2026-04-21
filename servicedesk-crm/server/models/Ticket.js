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
  internalNotes: [commentSchema], // 🔒 Private Field
  activity: [activitySchema],

  // 🤖 AI-POWERED FIELDS
  aiCategory: {
    type: String,
    enum: [
      "Technical Issue",
      "Billing Question",
      "Feature Request",
      "General Inquiry",
      "Bug Report",
      "Account Issue",
    ],
  },
  aiSentiment: {
    type: String,
    enum: ["Positive", "Neutral", "Negative", "Urgent"],
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 100,
  },
  aiSuggestedPriority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
  },
  aiProcessed: {
    type: Boolean,
    default: false,
  },
  aiProcessedAt: {
    type: Date,
  },

  // ===== 🎯 NEW: SLA MANAGEMENT FIELDS =====
  sla: {
    // Deadlines
    responseDeadline: {
      type: Date,
      description: 'When first response is due'
    },
    resolutionDeadline: {
      type: Date,
      description: 'When ticket should be resolved'
    },

    // Actual times
    firstResponseAt: {
      type: Date,
      default: null,
      description: 'When agent first responded'
    },
    resolvedAt: {
      type: Date,
      default: null,
      description: 'When ticket was marked as resolved'
    },

    // Breach tracking
    responseBreached: {
      type: Boolean,
      default: false
    },
    resolutionBreached: {
      type: Boolean,
      default: false
    },
    breachReason: {
      type: String,
      default: null
    },

    // Time tracking
    responseTime: {
      type: Number,
      description: 'Actual response time in minutes'
    },
    resolutionTime: {
      type: Number,
      description: 'Actual resolution time in minutes'
    },

    // Status indicators
    status: {
      type: String,
      enum: ['On Track', 'At Risk', 'Breached', 'Met'],
      default: 'On Track'
    }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ===== MIDDLEWARE TO UPDATE TIMESTAMP =====
ticketSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();

  // ===== 🎯 NEW: CALCULATE SLA ON TICKET CREATION =====
  if (this.isNew) {
    try {
      // Dynamically import SLA model (avoid circular dependency)
      const SLA = mongoose.model('SLA');
      const slaPolicy = await SLA.findOne({
        priority: this.priority,
        isActive: true
      });

      if (slaPolicy) {
        const now = new Date();

        // Calculate deadlines
        this.sla = {
          responseDeadline: new Date(now.getTime() + slaPolicy.responseTime * 60000),
          resolutionDeadline: new Date(now.getTime() + slaPolicy.resolutionTime * 60000),
          responseBreached: false,
          resolutionBreached: false,
          status: 'On Track'
        };

        console.log(`✅ SLA set for ticket ${this._id}: Response due in ${slaPolicy.responseTime} min, Resolution in ${slaPolicy.resolutionTime} min`);
      }
    } catch (error) {
      // If SLA model doesn't exist yet or error occurs, just continue without SLA
      console.log('⚠️  SLA calculation skipped:', error.message);
    }
  }

  next();
});

// ===== 🎯 NEW: METHOD TO CALCULATE SLA STATUS =====
ticketSchema.methods.calculateSLAStatus = function () {
  if (!this.sla || !this.sla.responseDeadline) return 'On Track';

  const now = new Date();
  const responseDeadline = new Date(this.sla.responseDeadline);
  const resolutionDeadline = new Date(this.sla.resolutionDeadline);

  // If already breached
  if (this.sla.responseBreached || this.sla.resolutionBreached) {
    return 'Breached';
  }

  // If resolved, check if it was on time
  if (this.status === 'Resolved' || this.status === 'Closed') {
    if (this.sla.resolvedAt && this.sla.resolvedAt <= resolutionDeadline) {
      return 'Met';
    } else {
      return 'Breached';
    }
  }

  // Check if approaching deadline (within 25% of time)
  const totalResponseTime = responseDeadline - this.createdAt;
  const totalResolutionTime = resolutionDeadline - this.createdAt;
  const elapsedTime = now - this.createdAt;

  // Response SLA
  if (!this.sla.firstResponseAt) {
    const responseProgress = elapsedTime / totalResponseTime;
    if (responseProgress > 0.75) {
      return 'At Risk';
    }
  }

  // Resolution SLA
  const resolutionProgress = elapsedTime / totalResolutionTime;
  if (resolutionProgress > 0.75) {
    return 'At Risk';
  }

  return 'On Track';
};

// ===== 🎯 NEW: METHOD TO GET TIME REMAINING =====
ticketSchema.methods.getTimeRemaining = function () {
  if (!this.sla || !this.sla.responseDeadline) return null;

  const now = new Date();

  // If not yet responded, show response time remaining
  if (!this.sla.firstResponseAt) {
    const responseDeadline = new Date(this.sla.responseDeadline);
    const minutesRemaining = Math.floor((responseDeadline - now) / 60000);

    return {
      type: 'response',
      minutes: minutesRemaining,
      formatted: this.formatTimeRemaining(minutesRemaining),
      deadline: responseDeadline
    };
  }

  // If responded but not resolved, show resolution time remaining
  if (this.status !== 'Resolved' && this.status !== 'Closed') {
    const resolutionDeadline = new Date(this.sla.resolutionDeadline);
    const minutesRemaining = Math.floor((resolutionDeadline - now) / 60000);

    return {
      type: 'resolution',
      minutes: minutesRemaining,
      formatted: this.formatTimeRemaining(minutesRemaining),
      deadline: resolutionDeadline
    };
  }

  return null;
};

// ===== 🎯 NEW: HELPER TO FORMAT TIME =====
ticketSchema.methods.formatTimeRemaining = function (minutes) {
  if (minutes < 0) {
    const absMinutes = Math.abs(minutes);
    if (absMinutes < 60) {
      return `${absMinutes} min overdue`;
    }
    const hours = Math.floor(absMinutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} overdue`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} overdue`;
  }

  if (minutes < 60) {
    return `${minutes} min remaining`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} remaining`;
};

// ===== INDEXES FOR BETTER QUERY PERFORMANCE =====
ticketSchema.index({ user: 1, status: 1 }); // Compound: Get all open tickets for a user
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ status: 1 });        // Filter by status (e.g. "Open")
ticketSchema.index({ priority: 1 });      // Filter by priority (e.g. "Urgent")
ticketSchema.index({ createdAt: -1 });    // Sort by newest first
ticketSchema.index({ aiCategory: 1 });
ticketSchema.index({ aiSentiment: 1 });

// ===== 🎯 NEW: SLA INDEXES =====
ticketSchema.index({ 'sla.responseDeadline': 1 });
ticketSchema.index({ 'sla.resolutionDeadline': 1 });
ticketSchema.index({ 'sla.status': 1 });
ticketSchema.index({ 'sla.responseBreached': 1 });
ticketSchema.index({ 'sla.resolutionBreached': 1 });

export default mongoose.model("Ticket", ticketSchema);