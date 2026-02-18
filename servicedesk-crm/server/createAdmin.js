// server/createAdmin.js - Script to create an admin user
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

// Import Customer model
import Customer from "./models/Customer.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/crm";

async function createAdminUser() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Customer.findOne({ email: "admin@servicedesk.com" });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("📧 Email:", existingAdmin.email);
      console.log("👤 Role:", existingAdmin.role);

      // Update to admin if not already
      // Update to admin if not already
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        console.log("✅ User role updated to admin");
      }

      // RESET PASSWORD TO ENSURE TEST SCRIPT WORKS
      const hashedPassword = await bcrypt.hash("admin123", 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log("✅ Password reset to 'admin123'");

      await mongoose.connection.close();
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = new Customer({
      name: "Admin User",
      email: "admin@servicedesk.com",
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    console.log("\n✅ Admin user created successfully!");
    console.log("=".repeat(50));
    console.log("📧 Email: admin@servicedesk.com");
    console.log("🔑 Password: admin123");
    console.log("👤 Role: admin");
    console.log("=".repeat(50));
    console.log("\n⚠️  Please change the password after first login!\n");

    await mongoose.connection.close();
    console.log("✅ Database connection closed");

  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
}

// Run the function
createAdminUser();