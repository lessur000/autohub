import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import { userRepository } from "./auth.repository.js";
import { randomBytes, createHash } from "node:crypto";
import { sendPasswordResetEmail } from "../../integrations/email/password-reset.email.js";
import { sendEmailVerification } from "../../integrations/email/email-verification.email.js";

const BCRYPT_ROUNDS = 12;

/**
 * =========================================================
 *  NORMALIZE EMAIL
 * =========================================================
 */
const normalizeEmail = (email) => email.trim().toLowerCase();

/**
 * HASH EMAIL VERIFICATION TOKEN
 */
const hashVerificationToken = (token) =>
  createHash("sha256").update(token).digest("hex");

/**
 * =========================================================
 *  FORMAT PUBLIC USER
 * =========================================================
 */
const toPublicUser = (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

/**
 * =========================================================
 *  GENERATE ACCESS TOKEN
 * =========================================================
 */
const createAccessToken = (user) => {
  if (!env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured.");
  }

  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN || "15m",
    algorithm: "HS256",
  });
};

/**
 * =========================================================
 *  REGISTER USER SERVICE
 * =========================================================
 */
export const register = async ({ fullName, email, password, phone }) => {
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await userRepository.findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError("Email is already registered.", 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await userRepository.createUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone ? phone.trim() : null,
    });

    // Send verification email after creating the account.
    await sendVerificationEmail(user);

    return {
      user: toPublicUser(user),
    };
  } catch (error) {
    if (error.code === "23505") {
      throw new AppError("Email is already registered.", 409);
    }

    throw error;
  }
};

/**
 * =========================================================
 *  LOGIN USER SERVICE
 * =========================================================
 */
export const login = async ({ email, password }) => {
  if (typeof email !== "string" || !email.trim()) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (typeof password !== "string" || !password) {
    throw new AppError("Invalid email or password.", 401);
  }

  const normalizedEmail = normalizeEmail(email);

  const user = await userRepository.findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches || !user.is_active) {
    throw new AppError("Invalid email or password.", 401);
  }

  // Block login until the email address is verified.
  if (!user.email_verified_at) {
    throw new AppError(
      "Please verify your email address before logging in.",
      403,
    );
  }

  const accessToken = createAccessToken(user);

  return {
    user: toPublicUser(user),
    accessToken,
    tokenType: "Bearer",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN || "15m",
  };
};

/**
 * =========================================================
 *  GET CURRENT USER SERVICE
 * =========================================================
 */
export const getCurrentUser = async (userId) => {
  const user = await userRepository.findUserById(userId);

  if (!user || !user.is_active) {
    throw new AppError("User account not found or inactive.", 401);
  }

  return toPublicUser(user);
};

/**
 * =========================================================
 * FORGOT PASSWORD
 * =========================================================
 */
export const forgotPassword = async ({ email }) => {
  if (typeof email !== "string" || !email.trim()) {
    throw new AppError("A valid email address is required.", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await userRepository.findUserByEmail(normalizedEmail);

  // Do not reveal whether an email is registered.
  if (!user || !user.is_active) {
    return {
      message:
        "If an account exists for that email, a password reset link will be sent.",
    };
  }

  const rawToken = randomBytes(32).toString("hex");

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await userRepository.createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const resetUrl = new URL("/reset-password", frontendUrl);
  resetUrl.searchParams.set("token", rawToken);

  await sendPasswordResetEmail({
    email: user.email,
    customerName: user.full_name,
    resetUrl: resetUrl.toString(),
  });

  return {
    message:
      "If an account exists for that email, a password reset link will be sent.",
  };
};

/**
 * =========================================================
 * RESET PASSWORD
 * =========================================================
 */
export const resetPassword = async ({ token, password }) => {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError("Invalid or expired password reset token.", 400);
  }

  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 72
  ) {
    throw new AppError("Password must be between 12 and 72 characters.", 400);
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const resetSuccessful = await userRepository.resetPasswordWithToken(
    tokenHash,
    passwordHash,
  );

  if (!resetSuccessful) {
    throw new AppError("Invalid or expired password reset token.", 400);
  }

  return {
    message: "Password reset successfully. You can now log in.",
  };
};

/**
 * SEND EMAIL VERIFICATION
 */
export const sendVerificationEmail = async (user) => {
  if (user.email_verified_at) {
    return;
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await userRepository.createEmailVerificationToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const verificationUrl = new URL("/verify-email", frontendUrl);
  verificationUrl.searchParams.set("token", rawToken);

  await sendEmailVerification({
    email: user.email,
    customerName: user.full_name,
    verificationUrl: verificationUrl.toString(),
  });
};

/**
 * VERIFY EMAIL
 */
export const verifyEmail = async ({ token }) => {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError("Invalid or expired verification token.", 400);
  }

  const tokenHash = hashVerificationToken(token);

  const verified = await userRepository.verifyEmailWithToken(tokenHash);

  if (!verified) {
    throw new AppError("Invalid or expired verification token.", 400);
  }

  return {
    message: "Email verified successfully.",
  };
};

/**
 * RESEND VERIFICATION EMAIL
 */
export const resendVerificationEmail = async ({ email }) => {
  if (typeof email !== "string" || !email.trim()) {
    throw new AppError("A valid email address is required.", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await userRepository.findUserByEmail(normalizedEmail);

  // Avoid revealing whether an account exists or is verified.
  if (!user || !user.is_active || user.email_verified_at) {
    return {
      message:
        "If an eligible account exists, a verification email will be sent.",
    };
  }

  await sendVerificationEmail(user);

  return {
    message:
      "If an eligible account exists, a verification email will be sent.",
  };
};
