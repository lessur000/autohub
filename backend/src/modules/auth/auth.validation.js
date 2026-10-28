import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
} from "../../shared/validators/commonSchemas.js";

const verificationTokenSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/i, "A valid token is required.");

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(120, "Full name must not exceed 120 characters."),

  email: emailSchema,

  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(72, "Password must not exceed 72 characters."),

  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 characters.")
    .max(32, "Phone number must not exceed 32 characters.")
    .nullable()
    .optional(),
});

export const loginSchema = z.object({
  email: emailSchema,

  password: z
    .string()
    .min(1, "Password is required.")
    .max(72, "Password must not exceed 72 characters."),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: verificationTokenSchema,
  password: passwordSchema.max(72, "Password must not exceed 72 characters."),
});

export const verifyEmailSchema = z.object({
  token: verificationTokenSchema,
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});
