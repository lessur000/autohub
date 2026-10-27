/**
 * =========================================================
 *  CATEGORIES VALIDATION
 * =========================================================
 */

import { isUuid } from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  VALIDATE CATEGORY ID
 * =========================================================
 */
export const validateCategoryId = (req, res, next) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category UUID.",
    });
  }

  next();
};

/**
 * =========================================================
 *  VALIDATE CATEGORY BODY
 * =========================================================
 */
export const validateCategoryBody = (req, res, next) => {
  const { name, slug, description, isActive } = req.body ?? {};
  const errors = [];

  if (req.method === "POST" && (typeof name !== "string" || !name.trim())) {
    errors.push("name is required.");
  }

  if (
    name !== undefined &&
    (typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 120)
  ) {
    errors.push("name must be between 2 and 120 characters.");
  }

  if (
    slug !== undefined &&
    (typeof slug !== "string" ||
      slug.trim().length < 2 ||
      slug.trim().length > 140)
  ) {
    errors.push("slug must be between 2 and 140 characters.");
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    errors.push("description must be a string or null.");
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    errors.push("isActive must be a boolean.");
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
