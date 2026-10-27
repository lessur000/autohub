import { pool } from "../../config/database.js";

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

export const findPaymentForRefund = async (paymentId, userId, db = pool) => {
  const result = await db.query(
    `
      SELECT p.*, o.user_id, o.status AS order_status
      FROM public.payments p
      JOIN public.orders o ON o.id = p.order_id
      WHERE p.id = $1 AND o.user_id = $2
      LIMIT 1
    `,
    [paymentId, userId],
  );

  return result.rows[0] ?? null;
};

export const findPaymentById = async (paymentId, db = pool) => {
  const result = await db.query(
    `SELECT * FROM public.payments WHERE id = $1 LIMIT 1`,
    [paymentId],
  );

  return result.rows[0] ?? null;
};

export const createRefundRequest = async (data, db = pool) => {
  const result = await db.query(
    `
      INSERT INTO public.refund_requests (
        payment_id, order_id, requested_by,
        amount, currency, status, reason
      )
      VALUES ($1, $2, $3, $4, $5, 'requested', $6)
      RETURNING *
    `,
    [
      data.paymentId,
      data.orderId,
      data.requestedBy,
      data.amount,
      data.currency,
      data.reason,
    ],
  );

  return result.rows[0];
};

export const findRefundById = async (refundId, db = pool) => {
  const result = await db.query(
    `SELECT * FROM public.refund_requests WHERE id = $1 FOR UPDATE`,
    [refundId],
  );

  return result.rows[0] ?? null;
};

export const updateRefundRequest = async (refundId, data, db = pool) => {
  const result = await db.query(
    `
      UPDATE public.refund_requests
      SET status = $2,
          reviewed_by = COALESCE($3, reviewed_by),
          reviewed_at = CASE
            WHEN $3::uuid IS NOT NULL THEN NOW()
            ELSE reviewed_at
          END,
          provider_refund_id = COALESCE($4, provider_refund_id),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      refundId,
      data.status,
      data.reviewedBy ?? null,
      data.providerRefundId ?? null,
    ],
  );

  return result.rows[0] ?? null;
};

export const findRefunds = async ({ userId, limit, offset }, db = pool) => {
  const result = await db.query(
    `
      SELECT rr.*
      FROM public.refund_requests rr
      JOIN public.orders o ON o.id = rr.order_id
      WHERE ($1::uuid IS NULL OR o.user_id = $1)
      ORDER BY rr.created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [userId ?? null, limit, offset],
  );

  return result.rows;
};

export const insertRefundLog = async (
  refundRequestId,
  actorUserId,
  eventType,
  details,
  db = pool,
) => {
  await db.query(
    `
      INSERT INTO public.refund_logs (
        refund_request_id, actor_user_id, event_type, details
      )
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [
      refundRequestId,
      actorUserId ?? null,
      eventType,
      JSON.stringify(details ?? {}),
    ],
  );
};
