import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import userAuthRouter from "./routes/userAuthRoutes.js";
import adminAuthRouter from "./routes/adminAuthRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import callRouter from "./routes/callRoutes.js";
import passport from "passport";
import "./config/passport.js";
import googleRouter from "./routes/googleAuth.js";
import cors from "cors";
import logger from "./utils/logger.js";
import { startSchedulers } from "./services/schedulerService.js";
import { initializeIdCounter } from "./services/idGeneratorService.js";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { initializeSocket } from "./utils/socket.js";
import visitorRoutes from "./routes/visitorRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import { checkSubscriptionAndTrial } from "./middleware/subscriptionCheck.js";
import { authenticate, requireAdmin } from "./middleware/auth.js";
import { detectSuspiciousActivity } from "./middleware/suspiciousActivityMiddleware.js";
import couponRoutes from "./routes/couponRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminApprovalRoutes from "./routes/adminApprovalRoutes.js";
import inactiveuserRoutes from "./routes/inactiveuserRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import emailRoutes from "./routes/emailRoutesM.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enhanced CORS configuration for iOS compatibility
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [process.env.CLIENT_URL];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(null, true); // Temporarily allow all origins for debugging
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "X-File-Name",
  ],
  exposedHeaders: ["Content-Length", "X-Requested-With"],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Additional headers for iOS compatibility
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );

  // Only apply no-cache headers to API routes, not static files
  if (req.path.startsWith("/api/")) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(checkSubscriptionAndTrial);
app.use(detectSuspiciousActivity);

// Serve static files with proper caching
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      // Set cache headers for images and other static files
      if (
        path.endsWith(".jpg") ||
        path.endsWith(".jpeg") ||
        path.endsWith(".png") ||
        path.endsWith(".gif") ||
        path.endsWith(".webp")
      ) {
        res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year for images
      } else {
        res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day for other files
      }
    },
  })
);

const PORT = process.env.PORT;
app.use(passport.initialize());
// Socket.IO setup
const server = http.createServer(app);
// Initialize socket.io with proper implementation
initializeSocket(server);

const startServer = async () => {
  await connectDB();

  // Initialize ID counter
  await initializeIdCounter();

  server.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
    // Initialize the daily recommendation scheduler
    startSchedulers();
  });
};

startServer();

app.get("/", (req, res) => {
  logger.info("Root endpoint accessed");
  return res.status(200).json({
    success: true,
    message: "Welcome to ESMatrimonial API",
  });
});

// Email verification page route
app.get("/verify-email/:token", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "email-verification.html"));
});

// Password reset page route
app.get("/reset-password/:token", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "password-reset.html"));
});

// Health check endpoint for iOS compatibility
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --- API Routes ---
app.use("/api/v1/auth", userAuthRouter);
app.use("/api/v1/users", authenticate, userRouter);
app.use("/api/v1/auth/admin", adminAuthRouter);
app.use("/api/v1/admin", authenticate, adminRouter);
app.use("/api/v1/admin/coupons", authenticate, requireAdmin, couponRoutes);
app.use("/api/v1/coupons/public", couponRoutes);
app.use("/api/v1/coupons", authenticate, couponRoutes);
app.use("/api/v1/admin/analytics", authenticate, requireAdmin, analyticsRoutes);
app.use("/api/v1/admin/inactive-users", authenticate, inactiveuserRoutes);
app.use("/api/v1/admin/approvals", authenticate, adminApprovalRoutes);
app.use("/api/v1/auth", googleRouter);
app.use("/api/v1/calls", authenticate, callRouter);
app.use("/api/v1/chat", authenticate, chatRoutes);
app.use("/api/v1/messages", authenticate, messageRoutes);
app.use("/api/v1/notifications", authenticate, notificationRoutes);
app.use("/api/v1/upload", authenticate, uploadRoutes);
app.use("/api/v1/verification", verificationRoutes);
// --- CORRECTED MIDDLEWARE ---
// Added 'requireAdmin' to ensure only admins can access this route for bulk operations.
app.use("/api/v1/email", authenticate, requireAdmin, emailRoutes);
app.use("/api/v1/visiter", authenticate, visitorRoutes);
app.use("/api/v1/requests", authenticate, requestRoutes);
app.use("/api/v1/subscription", authenticate, subscriptionRoutes);
app.use("/api/v1/feed", authenticate, feedRoutes);



// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: "Not Found" });
});

// Error handler with iOS compatibility
app.use((err, req, res, next) => {
  logger.error(`Server error: ${err.message}`);

  // iOS-friendly error response
  const errorResponse = {
    error: "Server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
    timestamp: new Date().toISOString(),
  };

  // Don't expose stack traces in production
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  res.status(500).json(errorResponse);
});
