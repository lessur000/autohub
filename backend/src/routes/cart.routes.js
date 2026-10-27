import { Router } from "express";
import * as cartController from "../modules/cart/cart.controller.js";
import {
  validateAddCartItem,
  validateCartProductId,
  validateUpdateCartItem,
} from "../modules/cart/cart.validation.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/", validateAddCartItem, cartController.addCartItem);
router.patch(
  "/:productId",
  validateCartProductId,
  validateUpdateCartItem,
  cartController.updateCartItem,
);
router.delete(
  "/:productId",
  validateCartProductId,
  cartController.deleteCartItem,
);
router.delete("/", cartController.clearCart);

export default router;
