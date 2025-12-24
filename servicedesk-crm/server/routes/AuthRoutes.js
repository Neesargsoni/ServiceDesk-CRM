// server/routes/AuthRoutes.js - COMPLETE FILE

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Customer from "../models/Customer.js";
// ✅ FIX: Import nodemailer correctly
import { createTransport } from "nodemailer";

const router = express.Router();

// ===== EXISTING LOGIN ROUTE =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await Customer.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user used OAuth (no password)
    if (user.oauthProvider && !user.password) {
      return res.status(400).json({ 
        message: `This account uses ${user.oauthProvider} login. Please sign in with ${user.oauthProvider}.` 
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send response
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== EXISTING REGISTER ROUTE (if you have one) =====
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await Customer.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await Customer.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== NEW: FORGOT PASSWORD ROUTE =====
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await Customer.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ 
        error: "This email is not registered. Please check and try again." 
      });
    }

    // Check if user used OAuth
    if (user.oauthProvider && !user.password) {
      return res.status(400).json({ 
        error: `This account uses ${user.oauthProvider} login. Please sign in with ${user.oauthProvider}.` 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token to user (expires in 1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Email message
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ServiceDesk CRM</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${user.name},</p>
            <p>You requested to reset your password for your ServiceDesk account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background-color: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${resetUrl}
            </p>
            <p><strong>⏰ This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from ServiceDesk CRM. Please do not reply to this email.</p>
            <p>© 2024 ServiceDesk CRM. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "🔐 Password Reset Request - ServiceDesk",
        message,
      });

      res.status(200).json({
        success: true,
        message: `Password reset email sent to ${user.email}. Please check your inbox and spam folder.`,
      });
    } catch (err) {
      console.error("Email send error:", err);
      
      // Remove token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        error: "Email could not be sent. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== NEW: RESET PASSWORD ROUTE =====
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: "Token and new password are required" 
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters" 
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ 
        error: "Password must contain at least one uppercase letter" 
      });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ 
        error: "Password must contain at least one lowercase letter" 
      });
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ 
        error: "Password must contain at least one number" 
      });
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return res.status(400).json({ 
        error: "Password must contain at least one special character" 
      });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token
    const user = await Customer.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token. Please request a new password reset.",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and remove reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    try {
      await sendEmail({
        email: user.email,
        subject: "✅ Password Changed Successfully - ServiceDesk",
        message: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .alert { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Password Changed</h1>
              </div>
              <div class="content">
                <h2>Hi ${user.name},</h2>
                <p>Your password has been successfully changed.</p>
                <p>You can now log in to your ServiceDesk account with your new password.</p>
                <div class="alert">
                  <p style="margin: 0;"><strong>⚠️ Didn't make this change?</strong></p>
                  <p style="margin: 5px 0 0 0;">If you didn't request this password change, please contact our support team immediately.</p>
                </div>
                <p>Best regards,<br><strong>ServiceDesk Team</strong></p>
              </div>
              <div class="footer">
                <p>© 2024 ServiceDesk CRM. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailErr) {
      console.error("Confirmation email failed:", emailErr);
      // Don't fail the request if confirmation email fails
    }

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== EMAIL SENDING FUNCTION =====
async function sendEmail(options) {
  // Create transporter
  const transporter = createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `ServiceDesk CRM <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  await transporter.sendMail(mailOptions);
}

export default router;