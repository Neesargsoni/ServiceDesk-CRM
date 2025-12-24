// server/models/Customer.js - UPDATE YOUR MODEL

import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: function() {
        // Password required only if not using OAuth
        return !this.oauthProvider;
      },
    },
    role: {
      type: String,
      enum: ["user", "agent", "admin"],
      default: "user",
    },
    
    // ===== NEW FIELDS FOR PASSWORD RESET =====
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpire: {
      type: Date,
      default: undefined,
    },
    
    // ===== NEW FIELDS FOR OAUTH =====
    oauthProvider: {
      type: String,
      enum: ["google", "facebook", "linkedin", "microsoft"],
      default: undefined,
    },
    oauthId: {
      type: String,
      default: undefined,
    },
    profilePicture: {
      type: String,
      default: undefined,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster lookups
customerSchema.index({ email: 1 });
customerSchema.index({ resetPasswordToken: 1 });
customerSchema.index({ oauthProvider: 1, oauthId: 1 });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;