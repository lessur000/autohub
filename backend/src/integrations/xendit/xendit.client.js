import { env } from "../../config/env.js";

const XENDIT_API_VERSION = "2024-11-11";

/**
 * =========================================================
 *  XENDIT API REQUEST
 * =========================================================
 */
export const xenditRequest = async (
  path,
  { method = "GET", body, idempotencyKey, apiVersion = false } = {},
) => {
  if (!env.XENDIT_SECRET_KEY) {
    throw new Error("XENDIT_SECRET_KEY is not configured.");
  }

  const baseUrl = (env.XENDIT_API_URL || "https://api.xendit.co").replace(
    /\/+$/,
    "",
  );

  const headers = {
    Authorization: `Basic ${Buffer.from(`${env.XENDIT_SECRET_KEY}:`).toString(
      "base64",
    )}`,
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(apiVersion ? { "api-version": XENDIT_API_VERSION } : {}),
    ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });

  const responseText = await response.text();

  let data;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error_code ||
        `Xendit API request failed (${response.status}).`,
    );

    error.statusCode = 502;
    error.providerStatus = response.status;
    error.providerError = data;

    throw error;
  }

  return data;
};
