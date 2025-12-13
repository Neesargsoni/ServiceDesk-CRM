import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["user", "agent", "admin"], 
      default: "user" 
    }
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);