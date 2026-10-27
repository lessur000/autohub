/**
 * =========================================================
 *  PRODUCTS CONTROLLER
 * =========================================================
 */

import * as productsService from "../products/product.service.js";

import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  CHECK ADMIN OR STAFF
 * =========================================================
 */
function canManageProducts(req) {
  return ["admin", "staff"].includes(
    String(req.user?.role ?? "").toLowerCase(),
  );
}

/**
 * =========================================================
 *  GET ALL PRODUCTS
 * =========================================================
 */
export const getProducts = asyncHandler(async (req, res) => {
  const products = await productsService.getProducts(
    req.query,
    canManageProducts(req),
  );

  return sendSuccess(res, products, "Products retrieved successfully.");
});

/**
 * =========================================================
 *  GET PRODUCT BY ID
 * =========================================================
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await productsService.getProductById(
    req.params.id,
    canManageProducts(req),
  );

  return sendSuccess(res, product, "Product retrieved successfully.");
});

/**
 * =========================================================
 *  CREATE PRODUCT
 * =========================================================
 */
export const createProduct = asyncHandler(async (req, res) => {
  const product = await productsService.createProduct(req.body);

  return sendSuccess(res, product, "Product created successfully.", 201);
});

/**
 * =========================================================
 *  UPDATE PRODUCT
 * =========================================================
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productsService.updateProduct(req.params.id, req.body);

  return sendSuccess(res, product, "Product updated successfully.");
});

// =========================================================
//  DELETE PRODUCT
// =========================================================
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productsService.setProductActive(
    req.params.productId,
    false,
  );

  return sendSuccess(res, product, "Product deactivated successfully.");
});

/**
 * =========================================================
 *  UPDATE PRODUCT ACTIVE STATUS
 * =========================================================
 */
export const setProductActive = asyncHandler(async (req, res) => {
  const product = await productsService.setProductActive(
    req.params.id,
    req.body.isActive,
  );

  return sendSuccess(res, product, "Product status updated successfully.");
});
