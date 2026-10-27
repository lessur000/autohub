/**
 * =========================================================
 *  CATEGORIES CONTROLLER
 * =========================================================
 */

import * as categoriesService from "./category.service.js";

import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  CHECK ADMIN OR STAFF
 * =========================================================
 */
function canManageCategories(req) {
  return ["admin", "staff"].includes(
    String(req.user?.role ?? "").toLowerCase(),
  );
}

/**
 * =========================================================
 *  GET ALL CATEGORIES
 * =========================================================
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoriesService.getCategories(
    req.query,
    canManageCategories(req),
  );

  return sendSuccess(res, categories, "Categories retrieved successfully.");
});

/**
 * =========================================================
 *  GET CATEGORY BY ID
 * =========================================================
 */
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoriesService.getCategoryById(req.params.id);

  return sendSuccess(res, category, "Category retrieved successfully.");
});

/**
 * =========================================================
 *  CREATE CATEGORY
 * =========================================================
 */
export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoriesService.createCategory(req.body);

  return sendSuccess(res, category, "Category created successfully.", 201);
});

/**
 * =========================================================
 *  UPDATE CATEGORY
 * =========================================================
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoriesService.updateCategory(
    req.params.id,
    req.body,
  );

  return sendSuccess(res, category, "Category updated successfully.");
});

/**
 * =========================================================
 *  UPDATE CATEGORY ACTIVE STATUS
 * =========================================================
 */
export const setCategoryActive = asyncHandler(async (req, res) => {
  const category = await categoriesService.setCategoryActive(
    req.params.id,
    req.body.isActive,
  );

  return sendSuccess(res, category, "Category status updated successfully.");
});
