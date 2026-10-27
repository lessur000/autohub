import { env } from "../../config/env.js";
import {
  httpError,
  parsePagination,
} from "../../shared/utils/moduleHelpers.js";
import * as refundRepository from "./refunds.repository.js";

const xenditRefundRequest = async (body, idempotencyKey) => {
  if (!env.XENDIT_SECRET_KEY) {
    throw httpError(500, "Xendit secret key is not configured.");
  }

  const response = await fetch(
    `${env.XENDIT_API_URL || "https://api.xendit.co"}/refunds`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${env.XENDIT_SECRET_KEY}:`,
        ).toString("base64")}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
    },
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result.message || "Xendit refund request failed.");
    error.statusCode = 502;
    throw error;
  }

  return result;
};

/**
 * =========================================================
 *  REQUEST REFUND
 * =========================================================
 */
export const requestRefund = async (userId, payload) => {
  const payment = await refundRepository.findPaymentForRefund(
    payload.paymentId,
    userId,
  );

  if (!payment) {
    throw httpError(404, "Payment not found.");
  }

  if (payment.status !== "paid") {
    throw httpError(409, "Only paid transactions can be refunded.");
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw httpError(400, "Refund amount must be greater than zero.");
  }

  const amount = Number(payload.amount);

  if (amount > Number(payment.amount)) {
    throw httpError(400, "Refund amount exceeds the original payment.");
  }

  return refundRepository.withTransaction(async (db) => {
    const refund = await refundRepository.createRefundRequest(
      {
        paymentId: payment.id,
        orderId: payment.order_id,
        requestedBy: userId,
        amount: amount.toFixed(2),
        currency: payment.currency.trim(),
        reason: payload.reason,
      },
      db,
    );

    await refundRepository.insertRefundLog(
      refund.id,
      userId,
      "refund.requested",
      { amount, reason: payload.reason },
      db,
    );

    return refund;
  });
};

/**
 * =========================================================
 *  LIST REFUNDS
 * =========================================================
 */
export const getRefunds = async (user, query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  const refunds = await refundRepository.findRefunds({
    userId: user.role === "admin" || user.role === "staff" ? null : user.id,
    limit,
    offset,
  });

  return { page, limit, refunds };
};

/**
 * =========================================================
 *  APPROVE AND SUBMIT REFUND
 * =========================================================
 */
export const approveRefund = async (refundId, adminUserId) => {
  const refund = await refundRepository.withTransaction(async (db) => {
    const current = await refundRepository.findRefundById(refundId, db);

    if (!current) {
      throw httpError(404, "Refund request not found.");
    }

    if (current.status !== "requested") {
      throw httpError(409, "Refund request has already been reviewed.");
    }

    const payment = await refundRepository.findPaymentById(
      current.payment_id,
      db,
    );

    if (!payment || payment.status !== "paid") {
      throw httpError(409, "Payment is not eligible for a refund.");
    }

    await refundRepository.updateRefundRequest(
      refundId,
      {
        status: "processing",
        reviewedBy: adminUserId,
      },
      db,
    );

    await refundRepository.insertRefundLog(
      refundId,
      adminUserId,
      "refund.approved",
      { amount: Number(current.amount) },
      db,
    );

    return { refund: current, payment };
  });

  // Do not hold a database transaction open while calling Xendit.
  const providerResult = await xenditRefundRequest(
    {
      reference_id: `AH-REFUND-${refund.refund.id}`,
      payment_request_id: refund.payment.provider_payment_request_id,
      currency: refund.payment.currency.trim(),
      amount: Number(refund.refund.amount),
      reason: "REQUESTED_BY_CUSTOMER",
    },
    `autohub-refund-${refund.refund.id}`,
  );

  await refundRepository.withTransaction(async (db) => {
    await refundRepository.updateRefundRequest(
      refund.refund.id,
      {
        status: "processing",
        reviewedBy: adminUserId,
        providerRefundId: providerResult.id,
      },
      db,
    );

    await refundRepository.insertRefundLog(
      refund.refund.id,
      adminUserId,
      "refund.submitted_to_provider",
      { providerRefundId: providerResult.id },
      db,
    );
  });

  return {
    refundId: refund.refund.id,
    providerRefundId: providerResult.id,
    providerStatus: providerResult.status,
    status: "processing",
  };
};

/**
 * =========================================================
 *  REJECT REFUND
 * =========================================================
 */
export const rejectRefund = async (refundId, adminUserId, reason) => {
  return refundRepository.withTransaction(async (db) => {
    const refund = await refundRepository.findRefundById(refundId, db);

    if (!refund) {
      throw httpError(404, "Refund request not found.");
    }

    if (refund.status !== "requested") {
      throw httpError(409, "Refund request has already been reviewed.");
    }

    const updated = await refundRepository.updateRefundRequest(
      refundId,
      { status: "rejected", reviewedBy: adminUserId },
      db,
    );

    await refundRepository.insertRefundLog(
      refundId,
      adminUserId,
      "refund.rejected",
      { reason },
      db,
    );

    return updated;
  });
};
