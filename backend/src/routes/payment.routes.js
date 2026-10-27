import { Router } from "express";

import * as paymentController from "../modules/payments/payments.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// Customer endpoint: authenticated user can pay only their own order.
router.post(
  "/orders/:orderId",
  authenticate,
  paymentController.createPaymentRequest,
);

// Provider callback: verify Xendit's callback token in the controller.
router.post("/webhooks/xendit", paymentController.xenditCallback);


router.post(
  "/webhooks/xendit-connectivity-test",
  paymentController.xenditWebhookConnectivityTest,
);


export default router;
