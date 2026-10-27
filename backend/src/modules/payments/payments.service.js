import { env } from "../../config/env.js";
import * as paymentRepository from "./payments.repository.js";
import { httpError } from "../../shared/utils/moduleHelpers.js";
import {
  verifyXenditWebhookToken,
  normalizeXenditWebhook,
} from "../../integrations/xendit/xendit.webhooks.js";
import {
  createPaymentRequest as createXenditPaymentRequest,
  getPaymentRequest,
  PH_PAYMENT_CHANNELS,
} from "../../integrations/xendit/xendit.payments.js";

/**
 * =========================================================
 * CREATE PAYMENT REQUEST
 * =========================================================
 */
export const createPaymentRequest = async (
  orderId,
  userId,
  requestedChannel = "QRPH",
  cardDetails = null,
) => {
  const order = await paymentRepository.findOrderForPayment(orderId, userId);

  if (!order) {
    throw httpError(404, "Order not found.");
  }

  if (order.status !== "pending") {
    throw httpError(409, "Only pending orders can start payment.");
  }

  if (requestedChannel === "CARDS") {
    if (!cardDetails || typeof cardDetails !== "object") {
      throw httpError(400, "Card details are required for card payments.");
    }

    const requiredCardFields = [
      "card_number",
      "cvn",
      "expiry_month",
      "expiry_year",
      "cardholder_first_name",
      "cardholder_last_name",
      "cardholder_email",
      "cardholder_phone_number",
    ];

    const missingCardField = requiredCardFields.find(
      (field) =>
        typeof cardDetails[field] !== "string" || !cardDetails[field].trim(),
    );

    if (missingCardField) {
      throw httpError(400, `Missing required card field: ${missingCardField}`);
    }

    // Basic format checks; these do not validate whether a card is genuine.
    if (!/^\d{12,19}$/.test(cardDetails.card_number)) {
      throw httpError(400, "Invalid card number format.");
    }

    if (!/^\d{3,4}$/.test(cardDetails.cvn)) {
      throw httpError(400, "Invalid CVN format.");
    }

    if (!/^(0[1-9]|1[0-2])$/.test(cardDetails.expiry_month)) {
      throw httpError(400, "Invalid card expiry month.");
    }

    if (!/^\d{4}$/.test(cardDetails.expiry_year)) {
      throw httpError(400, "Invalid card expiry year.");
    }
  }

  const selectedChannel = PH_PAYMENT_CHANNELS[requestedChannel];

  if (!selectedChannel) {
    throw httpError(400, "Unsupported payment method.");
  }

  const amount = Number(order.total_amount);
  const currency = String(order.currency).trim().toUpperCase();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw httpError(400, "Invalid order amount.");
  }

  if (currency !== "PHP") {
    throw httpError(400, "Only PHP payments are supported.");
  }

  // These URLs must be configured in the backend .env file.
  const successReturnUrl = env.XENDIT_SUCCESS_RETURN_URL;
  const failureReturnUrl = env.XENDIT_FAILURE_RETURN_URL;
  const cancelReturnUrl = env.XENDIT_CANCEL_RETURN_URL;

  if (!successReturnUrl || !failureReturnUrl) {
    throw httpError(
      500,
      "Xendit success and failure return URLs are not configured.",
    );
  }

  // Use a channel-specific reference so separate payment attempts
  // do not collide with the payments table's unique reference index.
  const referenceId = `autohub-order-${order.id}-${requestedChannel.toLowerCase()}`;

  const existing = await paymentRepository.findPaymentByReference(referenceId);

  if (existing) {
    // Do not create another request for the same channel/reference.
    // Reuse the existing record and reconcile its status separately.
    return existing;
  }

  // Prevent creating another payment after an order has already
  // received a successful payment through a different channel.
  const previousPayment = await paymentRepository.findPaymentForOrder(order.id);

  if (
    previousPayment &&
    ["paid", "partially_refunded", "refunded"].includes(
      String(previousPayment.status).toLowerCase(),
    )
  ) {
    throw httpError(409, "This order already has a successfully paid payment.");
  }

  let providerResult;

  try {
    providerResult = await createXenditPaymentRequest({
      referenceId,
      amount,
      currency,
      country: "PH",
      channelCode: selectedChannel.channelCode,
      description: `AutoHub order ${order.id}`,
      metadata: {
        order_id: String(order.id),
        source: "autohub",
      },
      idempotencyKey: `autohub-payment-${order.id}-${requestedChannel}`,

      // Required for payment methods that redirect the customer.
      successReturnUrl,
      failureReturnUrl,
      cancelReturnUrl: env.XENDIT_CANCEL_RETURN_URL,
      // Card details are passed only for the CARDS channel.
      cardDetails: requestedChannel === "CARDS" ? cardDetails : undefined,
    });
  } catch (error) {
    console.error("Xendit payment request creation failed:", {
      orderId: order.id,
      paymentMethod: requestedChannel,
      providerStatus: error.providerStatus ?? null,
      providerError: error.providerError ?? null,
      message: error.message,
    });

    throw httpError(
      error.statusCode || 502,
      error.message || "Unable to create Xendit payment.",
    );
  }

  const qrAction = providerResult.actions?.find(
    (action) =>
      action.type === "PRESENT_TO_CUSTOMER" &&
      action.descriptor === "QR_STRING",
  );

  const checkoutAction = providerResult.actions?.find(
    (action) =>
      action.type === "REDIRECT_CUSTOMER" && action.descriptor === "WEB_URL",
  );

  try {
    return await paymentRepository.createPayment({
      orderId: order.id,
      amount,
      currency,
      referenceId,
      providerPaymentRequestId: providerResult.payment_request_id,
      providerPaymentId: providerResult.payment_id ?? null,
      paymentMethod: requestedChannel,
      checkoutUrl: checkoutAction?.value ?? null,
      qrString: qrAction?.value ?? null,
      expiresAt: providerResult.channel_properties?.expires_at ?? null,
    });
  } catch (error) {
    console.error("Failed to save Xendit payment locally:", {
      orderId: order.id,
      referenceId,
      paymentRequestId: providerResult.payment_request_id ?? null,
      message: error.message,
    });

    // The provider may already have created the request.
    // Reconcile it before attempting a new payment.
    throw httpError(
      500,
      "Xendit may have created the payment, but saving it failed. Reconcile the payment before retrying.",
    );
  }
};

/**
 * =========================================================
 * REFRESH PAYMENT STATUS FROM XENDIT
 * =========================================================
 */
export const refreshPaymentStatus = async (orderId, userId) => {
  const order = await paymentRepository.findOrderForPayment(orderId, userId);

  if (!order) {
    throw httpError(404, "Order not found.");
  }

  const payment = await paymentRepository.findPaymentForOrder(orderId);

  if (!payment) {
    throw httpError(404, "Payment not found.");
  }

  if (!payment.provider_payment_request_id) {
    throw httpError(409, "Xendit payment request ID is missing.");
  }

  try {
    return await getPaymentRequest(payment.provider_payment_request_id);
  } catch (error) {
    throw httpError(
      error.statusCode || 502,
      error.message || "Unable to retrieve Xendit payment status.",
    );
  }
};

/**
 * =========================================================
 * VERIFY WEBHOOK TOKEN
 * =========================================================
 */
export const verifyWebhookToken = (token) => {
  if (!verifyXenditWebhookToken(token)) {
    throw httpError(401, "Invalid Xendit webhook token.");
  }

  return true;
};

/**
 * =========================================================
 * PROCESS PAYMENT CALLBACK
 * =========================================================
 */


export const processPaymentCallback = async (payload) => {
  const normalized = normalizeXenditWebhook(payload);

  const event = normalized.event;
  const data = normalized.data;

  if (!event || typeof event !== "string") {
    throw httpError(400, "Missing Xendit webhook event type.");
  }

  const requestId = data.payment_request_id ?? null;
  const providerPaymentId = data.payment_id ?? null;
  const referenceId = data.reference_id ?? null;

  // Current Xendit v3 event names.
  const supportedEvents = [
    "payment.capture",
    "payment.failure",
    "payment.authorization",
    "payment_request.expiry",
  ];

  if (!supportedEvents.includes(event)) {
    return {
      received: true,
      ignored: true,
      event,
    };
  }

  // Match against the IDs saved when creating the payment request.
  let payment = null;

  if (requestId) {
    payment =
      await paymentRepository.findPaymentByProviderRequestId(requestId);
  }

  if (!payment && referenceId) {
    payment = await paymentRepository.findPaymentByReference(referenceId);
  }

  if (!payment) {
    console.error("Xendit payment matching failed:", {
      event,
      requestId,
      providerPaymentId,
      referenceId,
    });

    throw httpError(404, "Matching payment was not found.");
  }

  // Verify amount and currency before changing payment status.
  if (
    data.request_amount !== undefined &&
    Number(data.request_amount) !== Number(payment.amount)
  ) {
    throw httpError(400, "Xendit payment amount does not match.");
  }

  if (
    data.currency &&
    String(data.currency).toUpperCase() !==
      String(payment.currency).toUpperCase()
  ) {
    throw httpError(400, "Xendit payment currency does not match.");
  }

  const providerStatus = String(data.status ?? "").toUpperCase();

  let newStatus;

  if (event === "payment.capture" && providerStatus === "SUCCEEDED") {
    newStatus = "paid";
  } else if (
    event === "payment.failure" ||
    providerStatus === "FAILED"
  ) {
    newStatus = "failed";
  } else if (
    event === "payment_request.expiry" ||
    providerStatus === "EXPIRED"
  ) {
    newStatus = "expired";
  } else if (
    providerStatus === "CANCELED" ||
    providerStatus === "CANCELLED"
  ) {
    newStatus = "cancelled";
  } else {
    return {
      received: true,
      ignored: true,
      event,
      providerStatus,
      currentStatus: payment.status,
    };
  }

  const providerEventId =
    providerPaymentId ??
    requestId ??
    data.id ??
    referenceId;

  if (!providerEventId) {
    throw httpError(400, "Xendit webhook is missing payment identifiers.");
  }

  return paymentRepository.applyPaymentWebhook({
    paymentId: payment.id,
    providerPaymentRequestId: requestId,
    providerPaymentId,
    referenceId,
    orderId: payment.order_id,
    status: newStatus,
    eventId: `${event}:${providerEventId}`,
    eventType: event,
    payload,
  });
};


/**
 * =========================================================
 * ENVIRONMENT CONFIGURATION CHECK
 * =========================================================
 */
export const isXenditConfigured = () => {
  return Boolean(
    env.XENDIT_SECRET_KEY &&
    env.XENDIT_API_URL &&
    env.XENDIT_WEBHOOK_TOKEN &&
    env.XENDIT_SUCCESS_RETURN_URL &&
    env.XENDIT_FAILURE_RETURN_URL,
  );
};
