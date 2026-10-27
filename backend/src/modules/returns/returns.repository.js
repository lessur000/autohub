import { pool } from "../../config/database.js";

/**
 * =========================================================
 *  CREATE RETURN REQUEST REPOSITORY
 * =========================================================
 */
export const createReturnRequest = async (client, data) => {
  const { orderId, orderItemId, userId, quantity, reason, description } = data;

  const query = `
    INSERT INTO public.return_requests (
      order_id,
      order_item_id,
      user_id,
      quantity,
      reason,
      description,
      status,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
    RETURNING *;
  `;

  const values = [
    orderId,
    orderItemId,
    userId,
    quantity,
    reason,
    description ?? null,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
};

/**
 * =========================================================
 *  FIND ORDER ITEM FOR RETURN
 * =========================================================
 */
export const findOrderItemForReturn = async (
  client,
  orderItemId,
  orderId,
  userId,
) => {
  const query = `
    SELECT
      oi.id AS order_item_id,
      oi.order_id,
      oi.product_id,
      oi.product_name_snapshot,
      oi.quantity AS purchased_quantity,
      o.user_id,
      o.status AS order_status
    FROM public.order_items oi
    INNER JOIN public.orders o
      ON o.id = oi.order_id
    WHERE oi.id = $1
      AND oi.order_id = $2
      AND o.user_id = $3
    FOR UPDATE OF oi;
  `;

  const { rows } = await client.query(query, [orderItemId, orderId, userId]);

  return rows[0] ?? null;
};

/**
 * =========================================================
 *  FIND EXISTING RETURN REQUEST
 * =========================================================
 */
export const findExistingReturnRequest = async (client, orderItemId) => {
  const query = `
    SELECT id, status, quantity
    FROM public.return_requests
    WHERE order_item_id = $1
      AND status IN ('pending', 'approved', 'received')
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [orderItemId]);

  return rows[0] ?? null;
};

/**
 * =========================================================
 *  GET CUSTOMER RETURN REQUESTS
 * =========================================================
 */
export const findReturnsByUser = async (userId) => {
  const query = `
    SELECT
      rr.*,
      oi.product_name_snapshot,
      oi.product_sku_snapshot
    FROM public.return_requests rr
    INNER JOIN public.order_items oi
      ON oi.id = rr.order_item_id
    WHERE rr.user_id = $1
    ORDER BY rr.created_at DESC;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows;
};

/**
 * =========================================================
 *  GET RETURN REQUEST BY ID
 * =========================================================
 */
export const findReturnById = async (returnId) => {
  const query = `
    SELECT
      rr.*,
      oi.product_name_snapshot,
      oi.product_sku_snapshot,
      o.order_number
    FROM public.return_requests rr
    INNER JOIN public.order_items oi
      ON oi.id = rr.order_item_id
    INNER JOIN public.orders o
      ON o.id = rr.order_id
    WHERE rr.id = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [returnId]);

  return rows[0] ?? null;
};

/**
 * =========================================================
 *  GET ALL RETURN REQUESTS FOR ADMIN
 * =========================================================
 */
export const findAllReturns = async ({ limit, offset, status }) => {
  const values = [];
  const conditions = [];

  if (status) {
    values.push(status);
    conditions.push(`rr.status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  values.push(limit);
  const limitIndex = values.length;

  values.push(offset);
  const offsetIndex = values.length;

  const query = `
    SELECT
      rr.*,
      oi.product_name_snapshot,
      oi.product_sku_snapshot,
      o.order_number,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM public.return_requests rr
    INNER JOIN public.order_items oi
      ON oi.id = rr.order_item_id
    INNER JOIN public.orders o
      ON o.id = rr.order_id
    INNER JOIN public.users u
      ON u.id = rr.user_id
    ${whereClause}
    ORDER BY rr.created_at DESC
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex};
  `;

  const { rows } = await pool.query(query, values);

  return rows;
};

/**
 * =========================================================
 *  UPDATE RETURN REQUEST STATUS
 * =========================================================
 */
export const updateReturnStatus = async (
  returnId,
  status,
  reviewedBy,
  reviewNote = null,
) => {
  const query = `
    UPDATE public.return_requests
    SET
      status = $2,
      reviewed_by = $3,
      review_note = $4,
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    returnId,
    status,
    reviewedBy,
    reviewNote,
  ]);

  return rows[0] ?? null;
};
