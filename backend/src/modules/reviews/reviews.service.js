import * as reviewsRepository from "./reviews.repository.js";
import {
  httpError,
  isUuid,
  parsePagination,
} from "../../shared/utils/moduleHelpers.js";

export const getProductReviews = async (productId, query = {}) => {
  if (!isUuid(productId)) {
    throw httpError(400, "Invalid product ID.");
  }

  const { page, limit, offset } = parsePagination(query);

  const reviews = await reviewsRepository.findProductReviews(productId, {
    limit,
    offset,
  });

  return { page, limit, reviews };
};

export const createReview = async (userId, payload) => {
  const { productId, orderItemId, rating, title, body } = payload;

  if (!isUuid(productId)) {
    throw httpError(400, "A valid productId is required.");
  }

  if (
    orderItemId !== undefined &&
    orderItemId !== null &&
    !isUuid(orderItemId)
  ) {
    throw httpError(400, "Invalid orderItemId.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw httpError(400, "Rating must be an integer between 1 and 5.");
  }

  if (title != null && (typeof title !== "string" || title.length > 160)) {
    throw httpError(400, "Review title must be at most 160 characters.");
  }

  if (body != null && (typeof body !== "string" || body.length > 5000)) {
    throw httpError(400, "Review body must be at most 5000 characters.");
  }

  if (!orderItemId) {
    throw httpError(
      400,
      "A delivered orderItemId is required to submit a review.",
    );
  }

  const purchasedItem = await reviewsRepository.findPurchasedOrderItem(
    orderItemId,
    productId,
    userId,
  );

  if (!purchasedItem) {
    throw httpError(
      403,
      "You can review only products from your delivered orders.",
    );
  }

  const existing = await reviewsRepository.findUserReview(productId, userId);

  if (existing) {
    throw httpError(409, "You have already reviewed this product.");
  }

  try {
    return await reviewsRepository.insertReview({
      productId,
      userId,
      orderItemId,
      rating,
      title: title?.trim() || null,
      body: body?.trim() || null,
    });
  } catch (error) {
    if (error.code === "23505") {
      throw httpError(409, "You have already reviewed this product.");
    }

    throw error;
  }
};

export const getAdminReviews = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  const reviews = await reviewsRepository.findAllReviews({
    limit,
    offset,
  });

  return { page, limit, reviews };
};

export const moderateReview = async (reviewId, isPublished) => {
  if (!isUuid(reviewId)) {
    throw httpError(400, "Invalid review ID.");
  }

  if (typeof isPublished !== "boolean") {
    throw httpError(400, "isPublished must be a boolean.");
  }

  const review = await reviewsRepository.setReviewPublished(
    reviewId,
    isPublished,
  );

  if (!review) {
    throw httpError(404, "Review not found.");
  }

  return review;
};

export const removeReview = async (reviewId, user) => {
  if (!isUuid(reviewId)) {
    throw httpError(400, "Invalid review ID.");
  }

  const deleted = await reviewsRepository.deleteReview(
    reviewId,
    user.id,
    user.role === "admin",
  );

  if (!deleted) {
    throw httpError(
      404,
      "Review not found or you are not allowed to delete it.",
    );
  }
};
