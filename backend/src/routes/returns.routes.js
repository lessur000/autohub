import { Router } from "express";
import {
  createReturnRequestController,
  getMyReturnsController,
  getMyReturnByIdController,
  getReturnsController,
  reviewReturnController,
} from "../modules/returns/returns.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

/**
 * =========================================================
 *  CUSTOMER RETURN ROUTES
 * =========================================================
 */
router.post("/", authenticate, createReturnRequestController);

router.get("/my", authenticate, getMyReturnsController);

router.get("/my/:returnId", authenticate, getMyReturnByIdController);

/**
 * =========================================================
 *  ADMIN RETURN ROUTES
 * =========================================================
 */
router.get("/", authenticate, authorize("admin"), getReturnsController);

router.patch(
  "/:returnId/review",
  authenticate,
  authorize("admin"),
  reviewReturnController,
);

export default router;
