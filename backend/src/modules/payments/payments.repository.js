
import { pool } from "../../config/database.js";

/**
 * FIND ORDER FOR PAYMENT
 */
export const findOrderForPayment = async (orderId, userId, db = pool) => {
  const result = await db.query(
    `
      SELECT id, order_number, user_id, status, total_amount, currency
      FROM public.orders
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [orderId, userId],
  );

  return result.rows[0] ?? null;
};

/**
 * FIND PAYMENT BY REFERENCE ID
 */
export const findPaymentByReference = async (referenceId, db = pool) => {
  const result = await db.query(
    `
      SELECT *
      FROM public.payments
      WHERE provider = 'xendit'
        AND provider_reference_id = $1
      LIMIT 1
    `,
    [referenceId],
  );

  return result.rows[0] ?? null;
};

/**
 * FIND PAYMENT BY XENDIT PAYMENT REQUEST ID
 */
export const findPaymentByProviderRequestId = async (
  requestId,
  db = pool,
) => {
  const result = await db.query(
    `
      SELECT *
      FROM public.payments
      WHERE provider = 'xendit'
        AND provider_payment_request_id = $1
      LIMIT 1
    `,
    [requestId],
  );

  return result.rows[0] ?? null;
};

/**
 * FIND PAYMENT BY XENDIT PAYMENT ID
 */
export const findPaymentByProviderPaymentId = async (
  providerPaymentId,
  db = pool,
) => {
  const result = await db.query(
    `
      SELECT *
      FROM public.payments
      WHERE provider = 'xendit'
        AND provider_payment_id = $1
      LIMIT 1
    `,
    [providerPaymentId],
  );

  return result.rows[0] ?? null;
};

/**
 * FIND LATEST PAYMENT FOR ORDER
 */
export const findPaymentForOrder = async (orderId, db = pool) => {
  const result = await db.query(
    `
      SELECT *
      FROM public.payments
      WHERE order_id = $1
        AND provider = 'xendit'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [orderId],
  );

  return result.rows[0] ?? null;
};

/**
 * CREATE PAYMENT RECORD
 */
export const createPayment = async (data, db = pool) => {
  const result = await db.query(
    `
      INSERT INTO public.payments (
        order_id,
        provider,
        status,
        amount,
        currency,
        provider_payment_request_id,
        provider_payment_id,
        provider_reference_id,
        payment_method,
        checkout_url,
        qr_string,
        expires_at
      )
      VALUES (
        $1, 'xendit', 'pending', $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      ON CONFLICT (provider_reference_id)
      DO UPDATE SET
        updated_at = NOW()
      RETURNING *
    `,
    [
      data.orderId,
      data.amount,
      data.currency,
      data.providerPaymentRequestId,
      data.providerPaymentId ?? null,
      data.referenceId,
      data.paymentMethod ?? null,
      data.checkoutUrl ?? null,
      data.qrString ?? null,
      data.expiresAt ?? null,
    ],
  );

  return result.rows[0];
};

/**
 * RECORD PAYMENT EVENT
 */
export const recordPaymentEvent = async (data, db = pool) => {
  const result = await db.query(
    `
      INSERT INTO public.payment_events (
        payment_id,
        order_id,
        provider,
        event_type,
        provider_event_id,
        payload,
        processed_at
      )
      VALUES ($1, $2, 'xendit', $3, $4, $5::jsonb, NOW())
      ON CONFLICT (provider, provider_event_id)
      DO NOTHING
      RETURNING id
    `,
    [
      data.paymentId ?? null,
      data.orderId ?? null,
      data.eventType,
      data.eventId,
      JSON.stringify(data.payload ?? {}),
    ],
  );

  return result.rows[0] ?? null;
};

/**
 * APPLY XENDIT PAYMENT WEBHOOK
 *
 * Expected data:
 * {
 *   paymentId: local database payment UUID,
 *   providerPaymentRequestId: Xendit payment request ID,
 *   providerPaymentId: Xendit payment ID,
 *   referenceId: saved provider reference ID,
 *   status: "paid" | "failed" | "expired" | "cancelled",
 *   eventId: unique provider event key,
 *   eventType: Xendit event name,
 *   payload: original webhook payload
 * }
 */
export const applyPaymentWebhook = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const paymentResult = await client.query(
      `
        SELECT *
        FROM public.payments
        WHERE
          (
            $1::uuid IS NOT NULL
            AND id = $1::uuid
          )
          OR (
            $2::text IS NOT NULL
            AND provider_payment_request_id = $2
          )
          OR (
            $3::text IS NOT NULL
            AND provider_reference_id = $3
          )
          OR (
            $4::text IS NOT NULL
            AND provider_payment_id = $4
          )
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
      `,
      [
        data.paymentId ?? null,
        data.providerPaymentRequestId ?? null,
        data.referenceId ?? null,
        data.providerPaymentId ?? null,
      ],
    );

    const payment = paymentResult.rows[0];

    if (!payment) {
      throw new Error("Payment not found while processing webhook.");
    }

    // Prevent a webhook from another provider updating this record.
    if (payment.provider !== "xendit") {
      throw new Error("Payment provider does not match Xendit.");
    }

    // The event ID must uniquely identify this status event.
    if (!data.eventId || !data.eventType) {
      throw new Error("Webhook event ID and event type are required.");
    }

    const eventResult = await client.query(
      `
        INSERT INTO public.payment_events (
          payment_id,
          order_id,
          provider,
          event_type,
          provider_event_id,
          payload,
          processed_at
        )
        VALUES ($1, $2, 'xendit', $3, $4, $5::jsonb, NOW())
        ON CONFLICT (provider, provider_event_id)
        DO NOTHING
        RETURNING id
      `,
      [
        payment.id,
        payment.order_id,
        data.eventType,
        data.eventId,
        JSON.stringify(data.payload ?? {}),
      ],
    );

    if (eventResult.rowCount === 0) {
      await client.query("COMMIT");
      return { received: true, duplicate: true };
    }

    const currentStatus = payment.status;
    const nextStatus = data.status;

    // Do not downgrade a completed or refunded payment.
    if (
      ["paid", "refunded", "partially_refunded"].includes(currentStatus)
    ) {
      await client.query("COMMIT");

      return {
        received: true,
        ignored: true,
        status: currentStatus,
      };
    }

    const allowedTransitions = {
      pending: ["paid", "failed", "expired", "cancelled"],
      authorized: ["paid", "failed", "cancelled"],
      failed: [],
      expired: [],
      cancelled: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
      await client.query("COMMIT");

      return {
        received: true,
        ignored: true,
        status: currentStatus,
        requestedStatus: nextStatus,
      };
    }

    await client.query(
      `
        UPDATE public.payments
        SET
          status = $2::public.payment_status,
          provider_payment_id = COALESCE(
            $3,
            provider_payment_id
          ),
          paid_at = CASE
            WHEN $2 = 'paid'
              THEN COALESCE(paid_at, NOW())
            ELSE paid_at
          END,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        payment.id,
        nextStatus,
        data.providerPaymentId ?? null,
      ],
    );

    if (nextStatus === "paid") {
      await client.query(
        `
          UPDATE public.orders
          SET
            status = 'confirmed',
            updated_at = NOW()
          WHERE id = $1
            AND status = 'pending'
        `,
        [payment.order_id],
      );
    }

    await client.query("COMMIT");

    return {
      received: true,
      status: nextStatus,
      paymentId: payment.id,
      orderId: payment.order_id,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
