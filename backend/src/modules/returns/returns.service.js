import { pool } from "../../config/database.js";
import {
  createReturnRequest,
  findOrderItemForReturn,
  findExistingReturnRequest,
  findReturnsByUser,
  findReturnById,
  findAllReturns,
  updateReturnStatus,
} from "./returns.repository.js";
import {
  httpError,
  parsePagination,
} from "../../shared/utils/moduleHelpers.js";

const RETURN_REASONS = [
  "damaged",
  "defective",
  "wrong_item",
  "missing_item",
  "other",
];

const RETURN_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "received",
  "completed",
  "cancelled",
];

/**
 * =========================================================
 *  CREATE RETURN REQUEST SERVICE
 * =========================================================
 */
export const requestReturn = async (userId, data) => {
  const { orderId, orderItemId, quantity, reason, description } = data;

  if (!orderId || !orderItemId) {
    throw httpError(400, "Order ID and order item ID are required.");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw httpError(400, "Return quantity must be a positive integer.");
  }

  if (!RETURN_REASONS.includes(reason)) {
    throw httpError(400, "Invalid return reason.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const item = await findOrderItemForReturn(
      client,
      orderItemId,
      orderId,
      userId,
    );

    if (!item) {
      throw httpError(404, "Order item not found for this customer.");
    }

    if (item.order_status !== "delivered") {
      throw httpError(400, "Only delivered orders can be returned.");
    }

    if (quantity > Number(item.purchased_quantity)) {
      throw httpError(400, "Return quantity exceeds the purchased quantity.");
    }

    const existing = await findExistingReturnRequest(client, orderItemId);

    if (existing) {
      throw httpError(
        409,
        "An active return request already exists for this item.",
      );
    }

    const returnRequest = await createReturnRequest(client, {
      orderId,
      orderItemId,
      userId,
      quantity,
      reason,
      description,
    });

    await client.query("COMMIT");

    return returnRequest;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * =========================================================
 *  GET CUSTOMER RETURNS SERVICE
 * =========================================================
 */
export const getMyReturns = async (userId) => {
  return findReturnsByUser(userId);
};

/**
 * =========================================================
 *  GET CUSTOMER RETURN DETAILS SERVICE
 * =========================================================
 */
export const getMyReturnById = async (userId, returnId) => {
  const returnRequest = await findReturnById(returnId);

  if (!returnRequest || returnRequest.user_id !== userId) {
    throw httpError(404, "Return request not found.");
  }

  return returnRequest;
};

/**
 * =========================================================
 *  GET ALL RETURNS SERVICE
 * =========================================================
 */
export const getReturns = async (query) => {
  const { limit, offset } = parsePagination(query);

  const status = query.status || undefined;

  if (status && !RETURN_STATUSES.includes(status)) {
    throw httpError(400, "Invalid return status filter.");
  }

  const returns = await findAllReturns({
    limit,
    offset,
    status,
  });

  return {
    items: returns,
    pagination: {
      limit,
      offset,
    },
  };
};

/**
 * =========================================================
 *  REVIEW RETURN REQUEST SERVICE
 * =========================================================
 */
export const reviewReturn = async (returnId, adminId, status, reviewNote) => {
  if (!["approved", "rejected"].includes(status)) {
    throw httpError(400, "Review status must be approved or rejected.");
  }

  const returnRequest = await findReturnById(returnId);

  if (!returnRequest) {
    throw httpError(404, "Return request not found.");
  }

  if (returnRequest.status !== "pending") {
    throw httpError(409, "Only pending return requests can be reviewed.");
  }

  const updated = await updateReturnStatus(
    returnId,
    status,
    adminId,
    reviewNote,
  );

  return updated;
};
