import { Router } from "express";

import * as orderController from "../modules/orders/order.controller.js";
import {
  validateCreateOrder,
  validateOrderId,
  validateOrderStatus,
} from "../modules/orders/order.validation.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.use(authenticate);

router.post("/", validateCreateOrder, orderController.createOrder);
router.get("/my", orderController.getMyOrders);

router.get(
  "/admin",
  authorize("admin", "staff"),
  orderController.getAdminOrders,
);

router.patch(
  "/admin/:orderId/status",
  authorize("admin", "staff"),
  validateOrderId,
  validateOrderStatus,
  orderController.changeOrderStatus,
);

router.get("/:orderId", validateOrderId, orderController.getOrderDetails);

export default router;
