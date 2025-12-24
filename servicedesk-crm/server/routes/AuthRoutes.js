// server/routes/AuthRoutes.js - WITH SENDGRID (No manual setup!)

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Customer from "../models/Customer.js";
// ✅ USE SENDGRID - No more Gmail App Passwords!
import sgMail from '@sendgrid/mail';

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const router = express.Router();

// ===== EXISTING LOGIN ROUTE =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await Customer.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.oauthProvider && !user.password) {
      return res.status(400).json({ 
        message: `This account uses ${user.oauthProvider} login. Please sign in with ${user.oauthProvider}.` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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

// ===== FORGOT PASSWORD ROUTE =====
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await Customer.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ 
        error: "This email is not registered. Please check and try again." 
      });
    }

    if (user.oauthProvider && !user.password) {
      return res.status(400).json({ 
        error: `This account uses ${user.oauthProvider} login. Please sign in with ${user.oauthProvider}.` 
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

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
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
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
        message: `Password reset email sent to ${user.email}. Please check your inbox.`,
      });
    } catch (err) {
      console.error("Email send error:", err);
      
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

// ===== RESET PASSWORD ROUTE =====
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: "Token and new password are required" 
      });
    }

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

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await Customer.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: "✅ Password Changed - ServiceDesk",
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10B981; color: white; padding: 20px; text-align: center;">
              <h1>✅ Password Changed</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Hi ${user.name},</h2>
              <p>Your password has been successfully changed.</p>
              <p>If you didn't make this change, contact support immediately.</p>
              <p>Best regards,<br><strong>ServiceDesk Team</strong></p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Confirmation email failed:", emailErr);
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully!",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== SENDGRID EMAIL FUNCTION =====
async function sendEmail(options) {
  const msg = {
    to: options.email,
    from: process.env.EMAIL_FROM, // Must be verified in SendGrid
    subject: options.subject,
    html: options.message,
  };

  await sgMail.send(msg);
  console.log(`✅ Email sent to ${options.email}`);
}

export default router;