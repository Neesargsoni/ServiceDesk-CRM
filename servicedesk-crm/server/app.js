// App.js - Main server file
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

// Import routes
import authRoutes from "./routes/AuthRoutes.js";
import customerRoutes from "./routes/CustomerRoutes.js";
import ticketRoutes from "./routes/TicketRoutes.js";

const app = express();
const httpServer = createServer(app);

// Socket.IO setup with proper CORS
// Update Socket.IO CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://servicedesk-crm.vercel.app",
      process.env.FRONTEND_URL
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  }
});

// CORS middleware for Express routes
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection - FIXED: Use 127.0.0.1 instead of localhost to force IPv4
const MONGO_URI = process.env.MONGO_URI ;


// Connect without deprecated options
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Make sure MongoDB service is running!");
    console.error("Run: net start MongoDB (as Administrator)");
  });

// MongoDB connection event listeners
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Join user-specific room
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room: user_${userId}`);
    }
  });

  // Join admin/agent room
  socket.on("joinAdminRoom", () => {
    socket.join("admins");
    console.log(`👔 User ${socket.id} joined admin room`);
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} (Reason: ${reason})`);
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Make io accessible to routes
app.set("io", io);

// Log all requests in development
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
// Update CORS for production
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://servicedesk-crm.vercel.app", // Your Vercel frontend URL
    process.env.FRONTEND_URL
  ],
  credentials: true
}));


// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "ServiceDesk CRM API is running",
    socketIO: "enabled",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/tickets", ticketRoutes);

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for real-time connections`);
  console.log(`📊 MongoDB: ${MONGO_URI}`);
  console.log(`🌐 CORS enabled for: http://localhost:5173`);
  console.log("=".repeat(50) + "\n");
  console.log("✅ Server is ready to accept connections!\n");
});

// Handle server startup errors
httpServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`   Kill the process using: npx kill-port ${PORT}`);
    console.error(`   Or change PORT in your .env file\n`);
  } else {
    console.error("❌ Server error:", error);
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  httpServer.close(() => {
    console.log("✅ HTTP server closed");

    mongoose.connection.close(false, () => {
      console.log("✅ MongoDB connection closed");
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Export io for use in routes
export { io };