import * as cartRepository from "./cart.repository.js";
import { httpError, isUuid } from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  GET CART
 * =========================================================
 */
export const getCart = async (userId) => {
  const items = await cartRepository.findCartByUserId(userId);

  const mappedItems = items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    sku: item.sku,
    name: item.name,
    slug: item.slug,
    price: Number(item.price),
    currency: item.currency,
    quantity: item.quantity,
    stockQuantity: item.stock_quantity,
    imageUrl: item.image_url,
    isAvailable: item.is_active && item.stock_quantity >= item.quantity,
    lineTotal: Number(item.price) * item.quantity,
  }));

  const subtotal = mappedItems.reduce(
    (total, item) => total + item.lineTotal,
    0,
  );

  return {
    items: mappedItems,
    itemCount: mappedItems.reduce((total, item) => total + item.quantity, 0),
    subtotal: Number(subtotal.toFixed(2)),
    currency: mappedItems[0]?.currency ?? "PHP",
  };
};

/**
 * =========================================================
 *  ADD ITEM TO CART
 * =========================================================
 */
export const addCartItem = async (userId, payload) => {
  const { productId, quantity } = payload;

  if (!isUuid(productId)) {
    throw httpError(400, "Invalid product ID.");
  }

  const product = await cartRepository.findActiveProduct(productId);

  if (!product) {
    throw httpError(404, "Product not found or inactive.");
  }

  const existing = await cartRepository.findCartItem(userId, productId);
  const requestedQuantity = (existing?.quantity ?? 0) + quantity;

  if (requestedQuantity > product.stock_quantity) {
    throw httpError(409, "Requested quantity exceeds available stock.");
  }

  if (requestedQuantity > 100) {
    throw httpError(400, "Cart quantity cannot exceed 100.");
  }

  await cartRepository.insertCartItem(userId, productId, quantity);

  return getCart(userId);
};

/**
 * =========================================================
 *  UPDATE CART ITEM
 * =========================================================
 */
export const updateCartItem = async (userId, productId, quantity) => {
  const product = await cartRepository.findActiveProduct(productId);

  if (!product) {
    throw httpError(404, "Product not found or inactive.");
  }

  if (quantity > product.stock_quantity) {
    throw httpError(409, "Requested quantity exceeds available stock.");
  }

  const updated = await cartRepository.updateCartItemQuantity(
    userId,
    productId,
    quantity,
  );

  if (!updated) {
    throw httpError(404, "Cart item not found.");
  }

  return getCart(userId);
};

/**
 * =========================================================
 *  REMOVE CART ITEM
 * =========================================================
 */
export const deleteCartItem = async (userId, productId) => {
  const deleted = await cartRepository.removeCartItem(userId, productId);

  if (!deleted) {
    throw httpError(404, "Cart item not found.");
  }

  return getCart(userId);
};

/**
 * =========================================================
 *  CLEAR CART
 * =========================================================
 */
export const deleteCart = async (userId) => {
  await cartRepository.clearCart(userId);
};
