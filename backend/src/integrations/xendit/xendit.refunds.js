import { xenditRequest } from "./xendit.client.js";

/**
 * =========================================================
 *  CREATE REFUND
 * =========================================================
 */
export const createXenditRefund = async ({
  referenceId,
  paymentRequestId,
  amount,
  currency = "PHP",
  reason = "REQUESTED_BY_CUSTOMER",
  idempotencyKey,
}) => {
  if (!referenceId || !paymentRequestId) {
    throw new Error("referenceId and paymentRequestId are required.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  const body = {
    reference_id: referenceId,
    payment_request_id: paymentRequestId,
    currency,
    amount,
    reason,
  };

  return xenditRequest("/refunds", {
    method: "POST",
    body,
    idempotencyKey,
  });
};
