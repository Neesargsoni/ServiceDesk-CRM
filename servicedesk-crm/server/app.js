// App.js - Main server file - CORS FIXED
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import session from "express-session";
import passport from "./config/passport.js";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/AuthRoutes.js";
import customerRoutes from "./routes/CustomerRoutes.js";
import ticketRoutes from "./routes/TicketRoutes.js";

// 🛡️ Security Imports
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";

const app = express();
const httpServer = createServer(app);

// 🛡️ Security Middleware

// 1. Set Security HTTP Headers
app.use(helmet());

// 2. Limit requests from same API (DDoS Protection)
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many requests from this IP, please try again in an hour!",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use("/api", limiter);

// 3. Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// 4. Data Sanitization against XSS
app.use(xss());

// 5. Prevent Parameter Pollution
app.use(hpp());

// Allowed origins for CORS (development + production)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://servicedesk-crm.vercel.app",
  "https://service-desk-crm-x2ao.vercel.app",
  "https://service-desk-crm.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

// Socket.IO setup with proper CORS
const io = new Server(httpServer, {
  cors: {
    origin: uniqueOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000
});

// ✅ FIXED CORS middleware with better origin checking
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      console.log("✅ CORS: Allowing request with no origin");
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (uniqueOrigins.includes(origin)) {
      console.log(`✅ CORS: Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS: Blocked request from origin: ${origin}`);
      console.warn(`   Allowed origins: ${uniqueOrigins.join(", ")}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Session (Required for OAuth state)
app.use(
  session({
    secret: process.env.JWT_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/crm";

console.log("🔍 Attempting to connect to MongoDB...");
console.log("📊 MongoDB URI:", MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Make sure MongoDB is accessible!");
    if (process.env.NODE_ENV === 'production') {
      console.error("Check your MONGO_URI environment variable in Render");
    }
  });

// MongoDB connection event listeners
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err.message);
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

  socket.on("join", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room: user_${userId}`);
    }
  });

  socket.on("joinAdminRoom", () => {
    socket.join("admins");
    console.log(`👔 User ${socket.id} joined admin room`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} (Reason: ${reason})`);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Make io accessible to routes
app.set("io", io);

// Request logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "ServiceDesk CRM API is running",
    socketIO: "enabled",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
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
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌍 CORS enabled for: ${uniqueOrigins.join(", ")}`);
  console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? "✅ Connected" : "⚠️ Not connected"}`);
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

    mongoose.connection.close()
      .then(() => {
        console.log("✅ MongoDB connection closed");
        process.exit(0);
      })
      .catch((err) => {
        console.error("Error closing MongoDB:", err);
        process.exit(1);
      });
  });

  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { io };