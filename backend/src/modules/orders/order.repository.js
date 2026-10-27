import { pool } from "../../config/database.js";

/**
 * =========================================================
 *  RUN DATABASE TRANSACTION
 * =========================================================
 */
export const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * =========================================================
 *  GET CART ITEMS FOR CHECKOUT
 * =========================================================
 */
export const findCheckoutItems = async (userId, db) => {
  const result = await db.query(
    `
      SELECT
        ci.product_id,
        ci.quantity,
        p.sku,
        p.name,
        p.price,
        p.currency,
        p.stock_quantity,
        p.is_active
      FROM public.cart_items ci
      INNER JOIN public.products p ON p.id = ci.product_id
      WHERE ci.user_id = $1
      ORDER BY ci.product_id
      FOR UPDATE OF p
    `,
    [userId],
  );

  return result.rows;
};

/**
 * =========================================================
 *  CREATE ORDER
 * =========================================================
 */
export const insertOrder = async (data, db) => {
  const result = await db.query(
    `
      INSERT INTO public.orders (
        order_number,
        user_id,
        status,
        currency,
        subtotal,
        shipping_fee,
        discount_amount,
        total_amount,
        shipping_address_snapshot,
        customer_note
      )
      VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8::jsonb, $9)
      RETURNING *
    `,
    [
      data.orderNumber,
      data.userId,
      data.currency,
      data.subtotal,
      data.shippingFee,
      data.discountAmount,
      data.totalAmount,
      JSON.stringify(data.shippingAddress),
      data.customerNote,
    ],
  );

  return result.rows[0];
};

/**
 * =========================================================
 *  CREATE ORDER ITEMS
 * =========================================================
 */
export const insertOrderItems = async (orderId, items, db) => {
  for (const item of items) {
    await db.query(
      `
        INSERT INTO public.order_items (
          order_id,
          product_id,
          product_sku_snapshot,
          product_name_snapshot,
          unit_price,
          quantity,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        orderId,
        item.product_id,
        item.sku,
        item.name,
        item.price,
        item.quantity,
        (Number(item.price) * item.quantity).toFixed(2),
      ],
    );
  }
};

/**
 * =========================================================
 *  DEDUCT STOCK
 * =========================================================
 */
export const deductStock = async (productId, quantity, orderId, userId, db) => {
  const result = await db.query(
    `
      UPDATE public.products
      SET stock_quantity = stock_quantity - $2,
          updated_at = NOW()
      WHERE id = $1
        AND is_active = TRUE
        AND stock_quantity >= $2
      RETURNING id
    `,
    [productId, quantity],
  );

  if (result.rowCount !== 1) {
    const error = new Error(
      "Product is unavailable or there is insufficient stock.",
    );
    error.statusCode = 409;
    throw error;
  }

  await db.query(
    `
      INSERT INTO public.inventory_movements (
        product_id,
        movement_type,
        quantity_delta,
        reference_type,
        reference_id,
        note,
        actor_user_id
      )
      VALUES ($1, 'sale', $2, 'order', $3, $4, $5)
    `,
    [productId, -quantity, orderId, "Stock deducted for order", userId],
  );
};

/**
 * =========================================================
 *  CLEAR CART AFTER CHECKOUT
 * =========================================================
 */
export const clearCheckoutCart = async (userId, db) => {
  await db.query(`DELETE FROM public.cart_items WHERE user_id = $1`, [userId]);
};

/**
 * =========================================================
 *  INSERT ORDER HISTORY
 * =========================================================
 */
export const insertOrderHistory = async (
  orderId,
  newStatus,
  changedBy,
  reason,
  db,
) => {
  await db.query(
    `
      INSERT INTO public.order_status_history (
        order_id, old_status, new_status, changed_by, reason
      )
      VALUES ($1, NULL, $2, $3, $4)
    `,
    [orderId, newStatus, changedBy, reason],
  );
};

/**
 * =========================================================
 *  INSERT ORDER EVENT
 * =========================================================
 */
export const insertOrderEvent = async (
  orderId,
  eventType,
  actorUserId,
  details,
  db,
) => {
  await db.query(
    `
      INSERT INTO public.order_events (
        order_id, event_type, actor_user_id, details
      )
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [orderId, eventType, actorUserId, JSON.stringify(details ?? {})],
  );
};

/**
 * =========================================================
 *  FIND ORDER BY ID
 * =========================================================
 */
export const findOrderById = async (orderId, db = pool) => {
  const result = await db.query(
    `SELECT * FROM public.orders WHERE id = $1 LIMIT 1`,
    [orderId],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  GET ORDER ITEMS
 * =========================================================
 */
export const findOrderItems = async (orderId, db = pool) => {
  const result = await db.query(
    `
      SELECT *
      FROM public.order_items
      WHERE order_id = $1
      ORDER BY created_at ASC
    `,
    [orderId],
  );

  return result.rows;
};

/**
 * =========================================================
 *  LIST ORDERS
 * =========================================================
 */
export const findOrders = async (
  { userId, status, limit, offset },
  db = pool,
) => {
  const result = await db.query(
    `
      SELECT o.*,
        (SELECT COUNT(*)::int FROM public.order_items oi
         WHERE oi.order_id = o.id) AS item_count
      FROM public.orders o
      WHERE ($1::uuid IS NULL OR o.user_id = $1)
        AND ($2::order_status IS NULL OR o.status = $2)
      ORDER BY o.placed_at DESC
      LIMIT $3 OFFSET $4
    `,
    [userId ?? null, status ?? null, limit, offset],
  );

  return result.rows;
};

/**
 * =========================================================
 *  UPDATE ORDER STATUS
 * =========================================================
 */
export const updateOrderStatus = async (
  orderId,
  newStatus,
  changedBy,
  reason,
  db,
) => {
  const currentResult = await db.query(
    `SELECT * FROM public.orders WHERE id = $1 FOR UPDATE`,
    [orderId],
  );

  const current = currentResult.rows[0];

  if (!current) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  const updatedResult = await db.query(
    `
      UPDATE public.orders
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [orderId, newStatus],
  );

  await db.query(
    `
      INSERT INTO public.order_status_history (
        order_id, old_status, new_status, changed_by, reason
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [orderId, current.status, newStatus, changedBy, reason ?? null],
  );

  await db.query(
    `
      INSERT INTO public.order_events (
        order_id, event_type, actor_user_id, details
      )
      VALUES ($1, 'order.status_changed', $2, $3::jsonb)
    `,
    [
      orderId,
      changedBy,
      JSON.stringify({
        oldStatus: current.status,
        newStatus,
        reason: reason ?? null,
      }),
    ],
  );

  return updatedResult.rows[0];
};
