import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import { userRepository } from "./auth.repository.js";

const BCRYPT_ROUNDS = 12;

/**
 * =========================================================
 *  NORMALIZE EMAIL
 * =========================================================
 */
const normalizeEmail = (email) => email.trim().toLowerCase();

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
export const register = async ({ fullName, email, password }) => {
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
    });

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
  const normalizedEmail = normalizeEmail(email);

  const user = await userRepository.findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches || !user.is_active) {
    throw new AppError("Invalid email or password.", 401);
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
