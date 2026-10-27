import { xenditRequest } from "./xendit.client.js";

// Only enable channels that are supported and activated
// for the merchant's Xendit account.
export const PH_PAYMENT_CHANNELS = {
  QRPH: {
    channelCode: "QRPH",
    label: "QRPh",
    type: "qr",
  },
  GCASH: {
    channelCode: "GCASH",
    label: "GCash",
    type: "redirect",
  },
  MAYA: {
    channelCode: "PAYMAYA",
    label: "Maya",
    type: "redirect",
  },
  GRABPAY: {
    channelCode: "GRABPAY",
    label: "GrabPay",
    type: "redirect",
  },
  SHOPEEPAY: {
    channelCode: "SHOPEEPAY",
    label: "ShopeePay",
    type: "redirect",
  },
  BPI_DIRECT_DEBIT: {
    channelCode: "BPI_DIRECT_DEBIT",
    label: "BPI",
    type: "redirect",
  },
  BPI_ONLINE_BANKING: {
    channelCode: "BPI_ONLINE_BANKING",
    label: "BPI Online Banking",
    type: "redirect",
  },
  CARDS: {
    channelCode: "CARDS",
    label: "Credit or debit card",
    type: "card",
  },
};

export const createPaymentRequest = async ({
  referenceId,
  amount,
  currency = "PHP",
  country = "PH",
  channelCode,
  description,
  metadata = {},
  expiresAt,
  idempotencyKey,
  successReturnUrl,
  failureReturnUrl,
  cancelReturnUrl,
  cardDetails,
}) => {
  if (!referenceId || typeof referenceId !== "string") {
    throw new Error("A valid referenceId is required.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (!channelCode) {
    throw new Error("A Xendit channelCode is required.");
  }

  if (!successReturnUrl || !failureReturnUrl) {
    throw new Error("Xendit success and failure return URLs are required.");
  }

  const channelProperties = {
  success_return_url: successReturnUrl,
  failure_return_url: failureReturnUrl,
  cancel_return_url: cancelReturnUrl || failureReturnUrl,
  ...(expiresAt ? { expires_at: expiresAt } : {}),
};

  if (channelCode === "CARDS") {
    if (!cardDetails) {
      throw new Error("Card details are required for CARDS.");
    }

    channelProperties.card_details = {
      card_number: cardDetails.card_number,
      cvn: cardDetails.cvn,
      expiry_month: cardDetails.expiry_month,
      expiry_year: cardDetails.expiry_year,
      cardholder_first_name: cardDetails.cardholder_first_name,
      cardholder_last_name: cardDetails.cardholder_last_name,
      cardholder_email: cardDetails.cardholder_email,
      cardholder_phone_number: cardDetails.cardholder_phone_number,
    };

    // Allow 3DS authentication rather than skipping it.
    channelProperties.skip_three_ds = false;
  }
  const body = {
    reference_id: referenceId,
    type: "PAY",
    country,
    currency,
    request_amount: amount,
    capture_method: "AUTOMATIC",
    channel_code: channelCode,
    description: description || `AutoHub order ${referenceId}`,
    metadata,
    channel_properties: channelProperties,
  };

  return xenditRequest("/v3/payment_requests", {
    method: "POST",
    body,
    idempotencyKey,
    apiVersion: true,
  });
};

export const createQrphPayment = async ({
  orderId,
  amount,
  currency = "PHP",
  description,
  idempotencyKey,
}) => {
  if (!orderId) {
    throw new Error("An orderId is required.");
  }

  return createPaymentRequest({
    referenceId: `autohub-order-${orderId}`,
    amount,
    currency,
    country: "PH",
    channelCode: "QRPH",
    description: description || `AutoHub order ${orderId}`,
    metadata: {
      order_id: String(orderId),
      source: "autohub",
    },
    idempotencyKey: idempotencyKey || `autohub-payment-${orderId}`,
  });
};

export const getPaymentRequest = async (paymentRequestId) => {
  if (!paymentRequestId) {
    throw new Error("A paymentRequestId is required.");
  }

  return xenditRequest(
    `/v3/payment_requests/${encodeURIComponent(paymentRequestId)}`,
    {
      method: "GET",
      apiVersion: true,
    },
  );
};
