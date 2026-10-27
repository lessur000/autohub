import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import * as reviewsController from "../modules/reviews/reviews.controller.js";

const router = Router();

// Public: published reviews only.
router.get("/products/:productId", reviewsController.getProductReviews);

// Customer: authenticated purchase review.
router.post("/", authenticate, reviewsController.createReview);

// Admin: review moderation.
router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  reviewsController.getAdminReviews,
);

router.patch(
  "/admin/:reviewId",
  authenticate,
  authorize("admin"),
  reviewsController.moderateReview,
);

router.delete("/:reviewId", authenticate, reviewsController.removeReview);

export default router;
