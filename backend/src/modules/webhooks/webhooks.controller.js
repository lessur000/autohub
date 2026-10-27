import * as webhookService from "./webhooks.service.js";
import { asyncHandler } from "../../shared/utils/moduleHelpers.js";

export const xenditWebhook = asyncHandler(async (req, res) => {
  const callbackToken = req.get("x-callback-token");
  const payload = req.body;

  console.log("[XENDIT WEBHOOK] Received", {
    event: payload?.event,
    paymentRequestId: payload?.data?.payment_request_id,
    paymentId: payload?.data?.payment_id,
    referenceId: payload?.data?.reference_id,
    status: payload?.data?.status,
    hasCallbackToken: Boolean(callbackToken),
  });

  const result = await webhookService.processWebhook(
    payload,
    callbackToken,
  );

  console.log("[XENDIT WEBHOOK] Processed", result);

  return res.status(200).json({
    success: true,
    data: result,
  });
});