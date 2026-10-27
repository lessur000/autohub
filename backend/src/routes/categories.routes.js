/**
 * =========================================================
 *  CATEGORIES ROUTES
 * =========================================================
 */

import { Router } from "express";

import * as categoriesController from "../modules/categories/category.controller.js";

import {
  validateCategoryId,
  validateCategoryBody,
} from "../modules/categories/category.validation.js";

import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

/**
 * =========================================================
 *  PUBLIC ROUTES
 * =========================================================
 */
router.get("/", categoriesController.getCategories);

router.get("/:id", validateCategoryId, categoriesController.getCategoryById);

/**
 * =========================================================
 *  ADMIN / STAFF ROUTES
 * =========================================================
 */
router.post(
  "/",
  authenticate,
  authorize("admin", "staff"),
  validateCategoryBody,
  categoriesController.createCategory,
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin", "staff"),
  validateCategoryId,
  validateCategoryBody,
  categoriesController.updateCategory,
);

router.patch(
  "/:id/active",
  authenticate,
  authorize("admin", "staff"),
  validateCategoryId,
  categoriesController.setCategoryActive,
);

export default router;
