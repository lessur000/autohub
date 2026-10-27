import * as paymentService from "./payments.service.js";
import {
  asyncHandler,
  sendSuccess,
  httpError,
} from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  CREATE PAYMENT CONTROLLER
 * =========================================================
 */

export const createPaymentRequest = asyncHandler(async (req, res) => {
  const { paymentMethod = "QRPH", cardDetails } = req.body ?? {};

  // Direct card details are permitted only in development/test mode.
  if (paymentMethod === "CARDS" && process.env.NODE_ENV === "production") {
    throw httpError(
      400,
      "Direct card details are disabled in production. Use a secure card collection flow.",
    );
  }

  const payment = await paymentService.createPaymentRequest(
    req.params.orderId,
    req.user.id,
    paymentMethod,
    paymentMethod === "CARDS" ? cardDetails : null,
  );

  return sendSuccess(
    res,
    payment,
    "Payment request created successfully.",
    201,
  );
});

/**
 * =========================================================
 *  XENDIT CALLBACK CONTROLLER
 * =========================================================
 */

export const xenditCallback = asyncHandler(async (req, res) => {
  const callbackToken = req.get("x-callback-token");

  if (!paymentService.verifyWebhookToken(callbackToken)) {
    return res.status(401).json({
      success: false,
      message: "Invalid Xendit callback token.",
    });
  }

  const result = await paymentService.processPaymentCallback(req.body);

  return res.status(200).json({
    success: true,
    data: result,
  });
});

export const xenditWebhookConnectivityTest = asyncHandler(async (req, res) => {
  const callbackToken = req.get("x-callback-token");

  if (!paymentService.verifyWebhookToken(callbackToken)) {
    return res.status(401).json({
      success: false,
      message: "Invalid Xendit callback token.",
    });
  }

  // Connectivity check only.
  // Never update payment or order status here.
  return res.status(200).json({
    success: true,
    message: "Xendit webhook connectivity test successful.",
  });
});
