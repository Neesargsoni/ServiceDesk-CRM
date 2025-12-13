import express from "express";
import Customer from "../models/Customer.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find customer by email
    const user = await Customer.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(404).json({ message: "User not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password for:", email);
      return res.status(400).json({ message: "Invalid password" });
    }

    console.log("User found:", { id: user._id, email: user.email, role: user.role });

    // Generate token with role
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        role: user.role || "user"  // Include role in token
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Login successful for:", user.email);

    return res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user"  // Make sure role is included
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      message: "Server error logging in",
      error: err.message 
    });
  }
});

export default router;