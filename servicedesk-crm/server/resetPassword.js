import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Customer from "./models/Customer.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/crm";

async function resetPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "super@yahoo.com";
    const newPassword = "password123"; // Change this if you want a different password

    // Find the user
    const user = await Customer.findOne({ email });
    
    if (!user) {
      console.log("❌ User not found:", email);
      await mongoose.disconnect();
      return;
    }

    console.log("✅ User found:", user.email);
    console.log("📋 Current role:", user.role);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    user.password = hashedPassword;
    await user.save();

    console.log("\n✅ Password reset successfully!");
    console.log("═══════════════════════════════════");
    console.log("📧 Email:", email);
    console.log("🔑 New Password:", newPassword);
    console.log("👤 Role:", user.role || "user");
    console.log("═══════════════════════════════════");
    console.log("\n✅ You can now login with these credentials!");

    await mongoose.disconnect();
    console.log("\n✅ Done!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

resetPassword();