import express from "express";
import { corsMiddleware } from "./config/cors.js";
import { logger } from "./config/logger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalRateLimiter } from "./middleware/rateLimiter.js";
import apiRoutes from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");

// Trust one proxy hop, if exactly one trusted proxy
// sits in front of this Express application.
app.set("trust proxy", 1);

app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// HTTP request logging.
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

// General API rate limiter.
app.use("/api", generalRateLimiter);

// Basic application health check.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AutoHub API is running",
    timestamp: new Date().toISOString(),
  });
});

// Register API routes.
app.use("/api", apiRoutes);

/**
 * =========================================================
 *  NOT FOUND & ERROR HANDLERS
 * =========================================================
 */
app.use(notFound);
app.use(errorHandler);

// Register existing API routes here when ready.
// Example:
// app.use("/api/auth", authRoutes);

// // Unknown route handler.
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

// // Central error handler.
// app.use((error, req, res, next) => {
//   if (res.headersSent) {
//     return next(error);
//   }

//   const statusCode =
//     error.message === "Origin not allowed by CORS"
//       ? 403
//       : error.status === 400 && error.type === "entity.parse.failed"
//         ? 400
//         : Number.isInteger(error.statusCode) &&
//             error.statusCode >= 400 &&
//             error.statusCode < 500
//           ? error.statusCode
//           : 500;

//   logger.error("Request failed", {
//     method: req.method,
//     path: req.path,
//     statusCode,
//     message: error.message,
//   });

//   res.status(statusCode).json({
//     success: false,
//     message:
//       statusCode >= 500
//         ? "Internal server error"
//         : statusCode === 403
//           ? "Origin not allowed"
//           : statusCode === 400
//             ? "Invalid request body"
//             : error.message,
//   });
// });
