import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";
import * as cartService from "./cart.service.js";

/**
 * =========================================================
 *  GET CART CONTROLLER
 * =========================================================
 */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);

  return sendSuccess(res, cart, "Cart retrieved successfully.");
});

/**
 * =========================================================
 *  ADD CART ITEM CONTROLLER
 * =========================================================
 */
export const addCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addCartItem(req.user.id, req.body);

  return sendSuccess(res, cart, "Item added to cart.", 201);
});

/**
 * =========================================================
 *  UPDATE CART ITEM CONTROLLER
 * =========================================================
 */
export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateCartItem(
    req.user.id,
    req.params.productId,
    req.body.quantity,
  );

  return sendSuccess(res, cart, "Cart item updated successfully.");
});

/**
 * =========================================================
 *  DELETE CART ITEM CONTROLLER
 * =========================================================
 */
export const deleteCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.deleteCartItem(
    req.user.id,
    req.params.productId,
  );

  return sendSuccess(res, cart, "Cart item removed successfully.");
});

/**
 * =========================================================
 *  CLEAR CART CONTROLLER
 * =========================================================
 */
export const clearCart = asyncHandler(async (req, res) => {
  await cartService.deleteCart(req.user.id);

  return sendSuccess(res, null, "Cart cleared successfully.");
});
