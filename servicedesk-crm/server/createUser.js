import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Customer from "./models/Customer.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/crm";

async function createUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if user already exists
    const existingUser = await Customer.findOne({ email: "super@yahoo.com" });
    if (existingUser) {
      console.log("⚠️ User already exists!");
      console.log("Email:", existingUser.email);
      console.log("Name:", existingUser.name);
      console.log("Role:", existingUser.role);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash("password123", 10);
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log("✅ Password updated to: password123");
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash("password123", 10);

      // Create the user
      const user = new Customer({
        name: "Super User",
        email: "super@yahoo.com",
        phone: "1234567890",
        password: hashedPassword,
        role: "admin"  // Make this user an admin
      });

      await user.save();
      console.log("✅ User created successfully!");
      console.log("Email:", user.email);
      console.log("Password: password123");
      console.log("Role:", user.role);
    }

    // Show all users
    const allUsers = await Customer.find({}, { password: 0 });
    console.log("\n📋 All users in database:");
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (Role: ${u.role || "user"})`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Done! You can now login with:");
    console.log("   Email: super@yahoo.com");
    console.log("   Password: password123");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

createUser();