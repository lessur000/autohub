import * as reviewsService from "./reviews.service.js";
import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";

export const getProductReviews = asyncHandler(async (req, res) => {
  const result = await reviewsService.getProductReviews(
    req.params.productId,
    req.query,
  );

  return sendSuccess(res, result, "Product reviews retrieved.");
});

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewsService.createReview(req.user.id, req.body);

  return sendSuccess(res, review, "Review submitted for moderation.", 201);
});

export const getAdminReviews = asyncHandler(async (req, res) => {
  const result = await reviewsService.getAdminReviews(req.query);

  return sendSuccess(res, result, "Reviews retrieved successfully.");
});

export const moderateReview = asyncHandler(async (req, res) => {
  const review = await reviewsService.moderateReview(
    req.params.reviewId,
    req.body.isPublished,
  );

  return sendSuccess(res, review, "Review moderation updated.");
});

export const removeReview = asyncHandler(async (req, res) => {
  await reviewsService.removeReview(req.params.reviewId, req.user);

  return sendSuccess(res, null, "Review deleted successfully.");
});
