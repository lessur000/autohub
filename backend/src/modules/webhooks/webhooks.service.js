import { env } from "../../config/env.js";
import { httpError } from "../../shared/utils/moduleHelpers.js";
import * as webhookRepository from "./webhooks.repository.js";
import * as paymentService from "../payments/payments.service.js";

export const verifyWebhookToken = (token) => {
  return paymentService.verifyWebhookToken(token);
};

/**
 * =========================================================
 *  PROCESS WEBHOOK EVENT
 * =========================================================
 */
export const processWebhook = async (payload, callbackToken) => {
  if (!verifyWebhookToken(callbackToken)) {
    throw httpError(401, "Invalid Xendit callback token.");
  }

  const eventType = payload.event ?? payload.event_type;

  const data = payload.data ?? payload;

  if (!eventType || typeof eventType !== "string") {
    throw httpError(400, "Missing webhook event type.");
  }

  const eventKey =
    payload.event_id ??
    payload.id ??
    data.id ??
    data.payment_id ??
    data.payment_request_id;

  if (!eventKey) {
    throw httpError(400, "Webhook event has no stable event identifier.");
  }

  const event = await webhookRepository.insertWebhookEvent({
    eventKey: String(eventKey),
    eventType,
    resourceId: data.id ?? data.payment_id ?? null,
    payload,
    verified: true,
  });

  // A duplicate event has already been recorded.
  if (!event) {
    return { received: true, duplicate: true };
  }

  try {
    if (eventType.startsWith("refund.")) {
      // Refund event processing is intentionally separate.
      // It must match data.id to refund_requests.provider_refund_id
      // before changing a refund's status.
      throw httpError(
        501,
        "Refund webhook mapping must be configured before enabling refund events.",
      );
    }

    await paymentService.processPaymentCallback(payload);

    await webhookRepository.markWebhookProcessed(String(eventKey));

    await webhookRepository.insertWebhookLog(
      event.id,
      "info",
      "Webhook processed successfully.",
      { eventType },
    );

    return { received: true, processed: true };
  } catch (error) {
    await webhookRepository.markWebhookFailed(String(eventKey), error.message);

    await webhookRepository.insertWebhookLog(
      event.id,
      "error",
      "Webhook processing failed.",
      { eventType, error: error.message },
    );

    throw error;
  }
};
