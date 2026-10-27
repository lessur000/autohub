import { isUuid, httpError } from "../../shared/utils/moduleHelpers.js";

export const validateOrderId = (req, res, next) => {
  if (!isUuid(req.params.orderId)) {
    return next(httpError(400, "Invalid order ID."));
  }

  next();
};

export const validateCreateOrder = (req, res, next) => {
  const { shippingAddress } = req.body ?? {};

  if (
    !shippingAddress ||
    typeof shippingAddress !== "object" ||
    Array.isArray(shippingAddress)
  ) {
    return next(httpError(400, "shippingAddress is required."));
  }

  next();
};

export const validateOrderStatus = (req, res, next) => {
  const { status } = req.body ?? {};

  const validStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ];

  if (!validStatuses.includes(status)) {
    return next(httpError(400, "Invalid order status."));
  }

  next();
};
