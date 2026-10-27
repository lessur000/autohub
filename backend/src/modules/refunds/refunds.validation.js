import { isUuid, httpError } from "../../shared/utils/moduleHelpers.js";

export const validateRefundRequest = (req, res, next) => {
  const { paymentId, amount, reason } = req.body ?? {};

  if (!isUuid(paymentId)) {
    return next(httpError(400, "A valid paymentId is required."));
  }

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return next(httpError(400, "A positive numeric amount is required."));
  }

  const validReasons = [
    "FRAUDULENT",
    "DUPLICATE",
    "REQUESTED_BY_CUSTOMER",
    "CANCELLATION",
    "OTHERS",
  ];

  if (!validReasons.includes(reason)) {
    return next(httpError(400, "Invalid refund reason."));
  }

  next();
};

export const validateRefundId = (req, res, next) => {
  if (!isUuid(req.params.refundId)) {
    return next(httpError(400, "Invalid refund ID."));
  }

  next();
};
