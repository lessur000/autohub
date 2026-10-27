import * as wishlistRepository from "./wishlist.repository.js";
import { httpError, isUuid } from "../../shared/utils/moduleHelpers.js";

export const getWishlist = async (userId) => {
  const items = await wishlistRepository.findWishlist(userId);

  return {
    items: items.map((item) => ({
      productId: item.product_id,
      sku: item.sku,
      name: item.name,
      slug: item.slug,
      description: item.description,
      price: Number(item.price),
      currency: item.currency.trim(),
      stockQuantity: item.stock_quantity,
      imageUrl: item.image_url,
      isAvailable: item.is_active && item.stock_quantity > 0,
      addedAt: item.added_at,
    })),
    count: items.length,
  };
};

export const addToWishlist = async (userId, productId) => {
  if (!isUuid(productId)) {
    throw httpError(400, "Invalid product ID.");
  }

  const product = await wishlistRepository.findActiveProduct(productId);

  if (!product) {
    throw httpError(404, "Product not found or inactive.");
  }

  await wishlistRepository.addWishlistItem(userId, productId);

  return getWishlist(userId);
};

export const removeFromWishlist = async (userId, productId) => {
  if (!isUuid(productId)) {
    throw httpError(400, "Invalid product ID.");
  }

  const removed = await wishlistRepository.removeWishlistItem(
    userId,
    productId,
  );

  if (!removed) {
    throw httpError(404, "Wishlist item not found.");
  }

  return getWishlist(userId);
};

export const clearWishlist = async (userId) => {
  await wishlistRepository.clearWishlist(userId);
};
