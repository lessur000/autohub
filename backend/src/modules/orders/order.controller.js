import * as orderService from "../orders/order.service.js";
import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);

  return sendSuccess(res, order, "Order created successfully.", 201);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getMyOrders(req.user.id, req.query);

  return sendSuccess(res, result, "Orders retrieved successfully.");
});

export const getOrderDetails = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderDetails(
    req.params.orderId,
    req.user,
  );

  return sendSuccess(res, order, "Order retrieved successfully.");
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getAdminOrders(req.query);

  return sendSuccess(res, result, "Admin orders retrieved successfully.");
});

export const changeOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.changeOrderStatus(
    req.params.orderId,
    req.body.status,
    req.user.id,
    req.body.reason,
  );

  return sendSuccess(res, order, "Order status updated successfully.");
});
