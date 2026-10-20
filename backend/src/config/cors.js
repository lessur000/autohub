import cors from "cors";
import { env } from "./env.js";

const allowedOrigins = new Set(env.FRONTEND_ORIGINS);

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Requests without Origin may include server-to-server calls.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],

  credentials: true,
  optionsSuccessStatus: 204,
});
