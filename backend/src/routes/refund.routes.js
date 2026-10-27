import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import * as refundController from "../modules/refunds/refunds.controller.js";
import {
  validateRefundRequest,
  validateRefundId,
} from "../modules/refunds/refunds.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", validateRefundRequest, refundController.requestRefund);
router.get("/", refundController.getRefunds);

router.post(
  "/:refundId/approve",
  authorize("admin", "staff"),
  validateRefundId,
  refundController.approveRefund,
);

router.post(
  "/:refundId/reject",
  authorize("admin", "staff"),
  validateRefundId,
  refundController.rejectRefund,
);

export default router;
