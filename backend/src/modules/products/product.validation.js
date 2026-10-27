/**
 * =========================================================
 *  PRODUCTS VALIDATION
 * =========================================================
 */

import { isUuid } from "../../shared/moduleHelpers.js";

/**
 * =========================================================
 *  VALIDATE PRODUCT ID
 * =========================================================
 */
export const validateProductId = (req, res, next) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product UUID.",
    });
  }

  next();
}

/**
 * =========================================================
 *  VALIDATE PRODUCT BODY
 * =========================================================
 */
export const validateProductBody = (req, res, next) => {
  const body = req.body ?? {};
  const errors = [];

  if (req.method === "POST") {
    if (typeof body.sku !== "string" || !body.sku.trim()) {
      errors.push("sku is required.");
    }

    if (typeof body.name !== "string" || !body.name.trim()) {
      errors.push("name is required.");
    }

    if (
      body.price === undefined ||
      !Number.isFinite(Number(body.price)) ||
      Number(body.price) < 0
    ) {
      errors.push("price must be a non-negative number.");
    }
  }

  if (
    body.sku !== undefined &&
    (typeof body.sku !== "string" || body.sku.trim().length > 80)
  ) {
    errors.push("sku must be at most 80 characters.");
  }

  if (
    body.name !== undefined &&
    (typeof body.name !== "string" ||
      body.name.trim().length < 2 ||
      body.name.trim().length > 200)
  ) {
    errors.push("name must be between 2 and 200 characters.");
  }

  if (
    body.slug !== undefined &&
    (typeof body.slug !== "string" ||
      body.slug.trim().length < 2 ||
      body.slug.trim().length > 220)
  ) {
    errors.push("slug must be between 2 and 220 characters.");
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    errors.push("description must be a string or null.");
  }

  if (
    body.price !== undefined &&
    (!Number.isFinite(Number(body.price)) || Number(body.price) < 0)
  ) {
    errors.push("price must be a non-negative number.");
  }

  if (
    body.stockQuantity !== undefined &&
    (!Number.isSafeInteger(Number(body.stockQuantity)) ||
      Number(body.stockQuantity) < 0)
  ) {
    errors.push("stockQuantity must be a non-negative integer.");
  }

  if (
    body.currency !== undefined &&
    (typeof body.currency !== "string" || !/^[A-Za-z]{3}$/.test(body.currency))
  ) {
    errors.push("currency must be a 3-letter currency code.");
  }

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    errors.push("isActive must be a boolean.");
  }

  if (
    body.categoryIds !== undefined &&
    (!Array.isArray(body.categoryIds) ||
      body.categoryIds.some((id) => !isUuid(id)))
  ) {
    errors.push("categoryIds must be an array of valid category UUIDs.");
  }

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
  }

  next();
}
