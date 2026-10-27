import { timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";

/**
 * =========================================================
 *  VERIFY XENDIT CALLBACK TOKEN
 * =========================================================
 */
export const verifyXenditWebhookToken = (receivedToken) => {
  const expectedToken = env.XENDIT_WEBHOOK_TOKEN;

  if (
    typeof expectedToken !== "string" ||
    expectedToken.length === 0 ||
    typeof receivedToken !== "string" ||
    receivedToken.length === 0
  ) {
    return false;
  }

  const received = Buffer.from(receivedToken, "utf8");
  const expected = Buffer.from(expectedToken, "utf8");

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
};

/**
 * =========================================================
 *  NORMALIZE XENDIT WEBHOOK PAYLOAD
 * =========================================================
 */

export const normalizeXenditWebhook = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid Xendit webhook payload.");
  }

  const event = payload.event ?? payload.event_type ?? null;

  // Xendit webhook payloads may carry the resource under `data`
  // or provide the resource fields at the top level.
  const data = payload.data ?? payload;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Xendit webhook data is missing.");
  }

  return {
    event,
    created: payload.created ?? null,
    data,
  };
};
