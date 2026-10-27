import * as wishlistService from "./wishlist.service.js";
import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);

  return sendSuccess(res, wishlist, "Wishlist retrieved successfully.");
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.addToWishlist(
    req.user.id,
    req.body.productId,
  );

  return sendSuccess(res, wishlist, "Product added to wishlist.", 201);
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.removeFromWishlist(
    req.user.id,
    req.params.productId,
  );

  return sendSuccess(res, wishlist, "Product removed from wishlist.");
});

export const clearWishlist = asyncHandler(async (req, res) => {
  await wishlistService.clearWishlist(req.user.id);

  return sendSuccess(res, null, "Wishlist cleared successfully.");
});
