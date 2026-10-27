/**
 * =========================================================
 *  USERS VALIDATION
 * =========================================================
 */

import { isUuid } from "../../shared/moduleHelpers.js";

/**
 * =========================================================
 *  VALIDATE USER ID
 * =========================================================
 */
export const validateUserId = (req, res, next) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "A valid user UUID is required.",
    });
  }

  next();
};

/**
 * =========================================================
 *  VALIDATE PROFILE UPDATE
 * =========================================================
 */
export const validateUpdateMe = (req, res, next) => {
  const { fullName, phone } = req.body ?? {};
  const errors = [];

  if (
    fullName !== undefined &&
    (typeof fullName !== "string" ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 160)
  ) {
    errors.push("fullName must be between 2 and 160 characters.");
  }

  if (
    phone !== undefined &&
    phone !== null &&
    (typeof phone !== "string" || phone.trim().length > 32)
  ) {
    errors.push("phone must be a string of at most 32 characters.");
  }

  if (fullName === undefined && phone === undefined) {
    errors.push("Provide fullName or phone to update.");
  }

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
  }

  next();
};

/**
 * =========================================================
 *  VALIDATE USER LIST PAGINATION
 * =========================================================
 */
export const validateListUsers = (req, res, next) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);

  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "page must be >= 1 and limit must be 1-100.",
    });
  }

  next();
};
