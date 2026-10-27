import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    // =====================================================
    // APP
    // =====================================================
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.coerce.number().int().min(1).max(65535).default(5000),

    // =====================================================
    // DATABASE
    // =====================================================
    DATABASE_URL: z.string().trim().default(""),

    DB_HOST: z.string().trim().default("127.0.0.1"),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
    DB_NAME: z.string().trim().default(""),
    DB_USER: z.string().trim().default(""),
    DB_PASSWORD: z.string().default(""),

    // =====================================================
    // FRONTEND / CORS
    // =====================================================
    FRONTEND_URL: z.string().url().default("http://localhost:5173"),

    ADMIN_FRONTEND_URL: z.string().url().default("http://localhost:5174"),

    FRONTEND_URLS: z
      .string()
      .default("http://localhost:5173,http://localhost:5174"),

    // =====================================================
    // JWT
    // =====================================================
    JWT_ACCESS_SECRET: z.string().min(32),
    REFRESH_TOKEN_SECRET: z.string().min(32),

    JWT_ACCESS_EXPIRES: z.string().default("15m"),
    JWT_REFRESH_EXPIRES: z.string().default("7d"),

    // =====================================================
    // DEVELOPMENT ADMIN
    // =====================================================
    AUTOHUB_DEV_ADMIN_EMAIL: z
      .string()
      .trim()
      .email()
      .default("admin@example.com"),

    AUTOHUB_DEV_ADMIN_PASSWORD: z.string().default(""),

    // =====================================================
    // XENDIT
    // =====================================================
    XENDIT_SECRET_KEY: z.string().default(""),
    XENDIT_WEBHOOK_TOKEN: z.string().default(""),

    XENDIT_API_URL: z.string().url().default("https://api.xendit.co"),

    XENDIT_SUCCESS_RETURN_URL: z
      .string()
      .url()
      .default("http://localhost:5173/payment/success"),

    XENDIT_FAILURE_RETURN_URL: z
      .string()
      .url()
      .default("http://localhost:5173/payment/failed"),
    XENDIT_CANCEL_RETURN_URL: z
      .string()
      .url()
      .default("http://localhost:5173/payment/cancelled"),

    // =====================================================
    // CLOUDINARY
    // =====================================================
    CLOUDINARY_CLOUD_NAME: z.string().default(""),
    CLOUDINARY_API_KEY: z.string().default(""),
    CLOUDINARY_API_SECRET: z.string().default(""),

    // =====================================================
    // EMAIL
    // =====================================================
    EMAIL_PROVIDER: z.enum(["mailtrap", "resend"]).default("mailtrap"),

    EMAIL_FROM_NAME: z.string().default("AutoHub"),

    EMAIL_FROM_EMAIL: z.string().email().default("no-reply@example.com"),

    // =====================================================
    // MAILTRAP
    // =====================================================
    MAILTRAP_HOST: z.string().default("sandbox.smtp.mailtrap.io"),

    MAILTRAP_PORT: z.coerce.number().int().min(1).max(65535).default(2525),

    MAILTRAP_USER: z.string().default(""),
    MAILTRAP_PASS: z.string().default(""),

    // =====================================================
    // RESEND
    // =====================================================
    RESEND_API_KEY: z.string().default(""),
  })
  .superRefine((data, ctx) => {
    // =====================================================
    // DATABASE CONFIGURATION
    // =====================================================
    if (data.NODE_ENV === "production" && !data.DATABASE_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required in production.",
      });
    }

    if (
      !data.DATABASE_URL &&
      (!data.DB_NAME || !data.DB_USER || !data.DB_PASSWORD)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["DB_NAME"],
        message:
          "Set DATABASE_URL or provide DB_NAME, DB_USER, and DB_PASSWORD.",
      });
    }

    if (data.DATABASE_URL) {
      try {
        const url = new URL(data.DATABASE_URL);

        if (!["postgres:", "postgresql:"].includes(url.protocol)) {
          throw new Error("Invalid PostgreSQL protocol");
        }

        if (!url.hostname || !url.pathname || url.pathname === "/") {
          throw new Error("Incomplete PostgreSQL URL");
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["DATABASE_URL"],
          message: "DATABASE_URL must be a valid PostgreSQL connection URL.",
        });
      }
    }

    // =====================================================
    // FRONTEND ORIGIN VALIDATION
    // =====================================================
    const origins = [
      data.FRONTEND_URL,
      data.ADMIN_FRONTEND_URL,
      ...data.FRONTEND_URLS.split(",").map((value) => value.trim()),
    ].filter(Boolean);

    for (const origin of origins) {
      try {
        const url = new URL(origin);

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid origin protocol");
        }

        if (url.pathname !== "/" || url.search || url.hash) {
          throw new Error("Origin must not contain a path, query, or hash");
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["FRONTEND_URLS"],
          message: `Invalid frontend origin: ${origin}`,
        });
      }
    }

    // =====================================================
    // XENDIT PRODUCTION RETURN URL VALIDATION
    // =====================================================
    if (
      data.NODE_ENV === "production" &&
      (data.XENDIT_SUCCESS_RETURN_URL.includes("localhost") ||
        data.XENDIT_FAILURE_RETURN_URL.includes("localhost"))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["XENDIT_SUCCESS_RETURN_URL"],
        message: "Production Xendit return URLs must not use localhost.",
      });
    }

    // =====================================================
    // PRODUCTION EMAIL CONFIGURATION
    // =====================================================
    if (
      data.NODE_ENV === "production" &&
      data.EMAIL_PROVIDER === "resend" &&
      !data.RESEND_API_KEY
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message:
          "RESEND_API_KEY is required when production email uses Resend.",
      });
    }

    // =====================================================
    // MAILTRAP CONFIGURATION
    // =====================================================
    if (
      data.EMAIL_PROVIDER === "mailtrap" &&
      (data.MAILTRAP_USER || data.MAILTRAP_PASS) &&
      (!data.MAILTRAP_USER || !data.MAILTRAP_PASS)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["MAILTRAP_USER"],
        message:
          "Set both MAILTRAP_USER and MAILTRAP_PASS when using Mailtrap credentials.",
      });
    }
  });

// =========================================================
// VALIDATE ENVIRONMENT VARIABLES
// =========================================================
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  throw new Error("Environment validation failed.");
}

const parsed = result.data;

// =========================================================
// NORMALIZE FRONTEND ORIGINS
// =========================================================
const normalizeOrigin = (value) => value.trim().replace(/\/+$/, "");

// =========================================================
// EXPORT ENVIRONMENT CONFIGURATION
// =========================================================
export const env = Object.freeze({
  ...parsed,

  FRONTEND_ORIGINS: [
    ...new Set(
      [
        ...parsed.FRONTEND_URLS.split(","),
        parsed.FRONTEND_URL,
        parsed.ADMIN_FRONTEND_URL,
      ]
        .map(normalizeOrigin)
        .filter(Boolean),
    ),
  ],
});
