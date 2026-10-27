import { pool } from "../../config/database.js";

export const insertWebhookEvent = async (data, db = pool) => {
  const result = await db.query(
    `
      INSERT INTO public.webhook_events (
        provider,
        event_key,
        event_type,
        resource_id,
        payload,
        signature_verified,
        status
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'received')
      ON CONFLICT (provider, event_key)
      DO NOTHING
      RETURNING *
    `,
    [
      "xendit",
      data.eventKey,
      data.eventType,
      data.resourceId ?? null,
      JSON.stringify(data.payload),
      data.verified,
    ],
  );

  return result.rows[0] ?? null;
};

export const markWebhookProcessed = async (eventKey, db = pool) => {
  await db.query(
    `
      UPDATE public.webhook_events
      SET status = 'processed',
          attempts = attempts + 1,
          processed_at = NOW(),
          last_error = NULL
      WHERE provider = 'xendit' AND event_key = $1
    `,
    [eventKey],
  );
};

export const markWebhookFailed = async (eventKey, errorMessage, db = pool) => {
  await db.query(
    `
      UPDATE public.webhook_events
      SET status = 'failed',
          attempts = attempts + 1,
          last_error = $2
      WHERE provider = 'xendit' AND event_key = $1
    `,
    [eventKey, errorMessage],
  );
};

export const insertWebhookLog = async (
  eventId,
  level,
  message,
  context = {},
  db = pool,
) => {
  await db.query(
    `
      INSERT INTO public.webhook_logs (
        webhook_event_id, level, message, context
      )
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [eventId ?? null, level, message, JSON.stringify(context)],
  );
};
