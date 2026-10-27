import { isUuid, httpError } from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  VALIDATE PRODUCT ID
 * =========================================================
 */
export const validateCartProductId = (req, res, next) => {
  const { productId } = req.params;

  if (!isUuid(productId)) {
    return next(httpError(400, "Invalid product ID."));
  }

  next();
};

/**
 * =========================================================
 *  VALIDATE ADD CART ITEM
 * =========================================================
 */
export const validateAddCartItem = (req, res, next) => {
  const { productId, quantity } = req.body ?? {};

  if (!isUuid(productId)) {
    return next(httpError(400, "A valid productId is required."));
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
    return next(
      httpError(400, "Quantity must be an integer between 1 and 100."),
    );
  }

  next();
};

/**
 * =========================================================
 *  VALIDATE UPDATE CART ITEM
 * =========================================================
 */
export const validateUpdateCartItem = (req, res, next) => {
  const { quantity } = req.body ?? {};

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
    return next(
      httpError(400, "Quantity must be an integer between 1 and 100."),
    );
  }

  next();
};
