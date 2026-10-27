import * as orderRepository from "../orders/order.repository.js";
import {
  httpError,
  parsePagination,
} from "../../shared/utils/moduleHelpers.js";

/**
 * =========================================================
 *  CREATE ORDER FROM CART
 * =========================================================
 */
export const createOrder = async (userId, payload) => {
  const {
    shippingAddress,
    shippingFee = 0,
    discountAmount = 0,
    customerNote = null,
  } = payload;

  if (
    !shippingAddress ||
    typeof shippingAddress !== "object" ||
    Array.isArray(shippingAddress)
  ) {
    throw httpError(400, "A valid shippingAddress object is required.");
  }

  const requiredAddressFields = [
    "recipientName",
    "phone",
    "addressLine1",
    "city",
    "province",
  ];

  for (const field of requiredAddressFields) {
    if (
      typeof shippingAddress[field] !== "string" ||
      !shippingAddress[field].trim()
    ) {
      throw httpError(400, `${field} is required in shippingAddress.`);
    }
  }

  if (
    !Number.isFinite(shippingFee) ||
    shippingFee < 0 ||
    !Number.isFinite(discountAmount) ||
    discountAmount < 0
  ) {
    throw httpError(400, "Invalid shipping fee or discount amount.");
  }

  return orderRepository.withTransaction(async (db) => {
    const items = await orderRepository.findCheckoutItems(userId, db);

    if (items.length === 0) {
      throw httpError(400, "Your cart is empty.");
    }

    for (const item of items) {
      if (!item.is_active) {
        throw httpError(409, `${item.name} is no longer available.`);
      }

      if (item.quantity > item.stock_quantity) {
        throw httpError(409, `Insufficient stock for ${item.name}.`);
      }
    }

    const currencies = [...new Set(items.map((item) => item.currency.trim()))];

    if (currencies.length !== 1) {
      throw httpError(400, "All cart products must use the same currency.");
    }

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    const total = Number((subtotal + shippingFee - discountAmount).toFixed(2));

    if (total <= 0) {
      throw httpError(400, "Order total must be greater than zero.");
    }

    if (discountAmount > subtotal + shippingFee) {
      throw httpError(400, "Discount cannot exceed the order value.");
    }

    const orderNumber = `AH-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    const order = await orderRepository.insertOrder(
      {
        orderNumber,
        userId,
        currency: currencies[0],
        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        totalAmount: total.toFixed(2),
        shippingAddress,
        customerNote,
      },
      db,
    );

    await orderRepository.insertOrderItems(order.id, items, db);

    for (const item of items) {
      await orderRepository.deductStock(
        item.product_id,
        item.quantity,
        order.id,
        userId,
        db,
      );
    }

    await orderRepository.insertOrderHistory(
      order.id,
      "pending",
      userId,
      "Order created from cart",
      db,
    );

    await orderRepository.insertOrderEvent(
      order.id,
      "order.created",
      userId,
      { orderNumber: order.order_number, totalAmount: total },
      db,
    );

    await orderRepository.clearCheckoutCart(userId, db);

    return {
      ...order,
      subtotal: Number(order.subtotal),
      shipping_fee: Number(order.shipping_fee),
      discount_amount: Number(order.discount_amount),
      total_amount: Number(order.total_amount),
      items: items.map((item) => ({
        productId: item.product_id,
        sku: item.sku,
        name: item.name,
        unitPrice: Number(item.price),
        quantity: item.quantity,
        lineTotal: Number((Number(item.price) * item.quantity).toFixed(2)),
      })),
    };
  });
};

/**
 * =========================================================
 *  GET CURRENT USER ORDERS
 * =========================================================
 */
export const getMyOrders = async (userId, query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  const orders = await orderRepository.findOrders({
    userId,
    status: query.status || null,
    limit,
    offset,
  });

  return { page, limit, orders };
};

/**
 * =========================================================
 *  GET ORDER DETAILS
 * =========================================================
 */
export const getOrderDetails = async (orderId, user) => {
  const order = await orderRepository.findOrderById(orderId);

  if (!order) {
    throw httpError(404, "Order not found.");
  }

  if (user.role !== "admin" && order.user_id !== user.id) {
    throw httpError(403, "You are not allowed to view this order.");
  }

  const items = await orderRepository.findOrderItems(orderId);

  return {
    ...order,
    subtotal: Number(order.subtotal),
    shipping_fee: Number(order.shipping_fee),
    discount_amount: Number(order.discount_amount),
    total_amount: Number(order.total_amount),
    items,
  };
};

/**
 * =========================================================
 *  GET ADMIN ORDERS
 * =========================================================
 */
export const getAdminOrders = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  const orders = await orderRepository.findOrders({
    userId: null,
    status: query.status || null,
    limit,
    offset,
  });

  return { page, limit, orders };
};

/**
 * =========================================================
 *  UPDATE ORDER STATUS
 * =========================================================
 */
export const changeOrderStatus = async (
  orderId,
  status,
  actorUserId,
  reason,
) => {
  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ];

  if (!allowedStatuses.includes(status)) {
    throw httpError(400, "Invalid order status.");
  }

  return orderRepository.withTransaction(async (db) => {
    const current = await orderRepository.findOrderById(orderId, db);

    if (!current) {
      throw httpError(404, "Order not found.");
    }

    if (current.status === status) {
      throw httpError(409, "Order already has this status.");
    }

    if (["cancelled", "returned"].includes(current.status)) {
      throw httpError(409, "This order can no longer change status.");
    }

    // Paid orders must be refunded through the payment/refund workflow.
    if (
      status === "cancelled" &&
      ["confirmed", "processing", "shipped", "delivered"].includes(
        current.status,
      )
    ) {
      throw httpError(
        409,
        "Use the appropriate cancellation/refund workflow for this order.",
      );
    }

    return orderRepository.updateOrderStatus(
      orderId,
      status,
      actorUserId,
      reason,
      db,
    );
  });
};
