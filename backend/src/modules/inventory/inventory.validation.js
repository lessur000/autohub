import { isUuid, httpError } from "../../shared/utils/moduleHelpers.js";

export const validateStockAdjustment = (req, res, next) => {
  const { productId, movementType, quantityDelta } = req.body ?? {};

  if (!isUuid(productId)) {
    return next(httpError(400, "A valid productId is required."));
  }

  if (!["restock", "adjustment"].includes(movementType)) {
    return next(httpError(400, "Invalid inventory movement type."));
  }

  if (!Number.isSafeInteger(quantityDelta) || quantityDelta === 0) {
    return next(httpError(400, "quantityDelta must be a non-zero integer."));
  }

  next();
};
