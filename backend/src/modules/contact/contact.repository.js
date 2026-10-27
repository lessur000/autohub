import { pool } from "../../config/database.js";

export const createMessage = async (data, db = pool) => {
  const result = await db.query(
    `
      INSERT INTO public.contact_messages (
        user_id, name, email, subject, message
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      data.userId ?? null,
      data.name,
      data.email,
      data.subject ?? null,
      data.message,
    ],
  );

  return result.rows[0];
};

export const findMessages = async ({ status, limit, offset }, db = pool) => {
  const result = await db.query(
    `
      SELECT *
      FROM public.contact_messages
      WHERE ($1::varchar IS NULL OR status = $1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [status ?? null, limit, offset],
  );

  return result.rows;
};

export const findMessageById = async (messageId, db = pool) => {
  const result = await db.query(
    `SELECT * FROM public.contact_messages WHERE id = $1 LIMIT 1`,
    [messageId],
  );

  return result.rows[0] ?? null;
};

export const updateMessageStatus = async (messageId, status, db = pool) => {
  const result = await db.query(
    `
      UPDATE public.contact_messages
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [messageId, status],
  );

  return result.rows[0] ?? null;
};
