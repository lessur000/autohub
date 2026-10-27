/**
 * =========================================================
 *  USERS REPOSITORY
 * =========================================================
 */

import { pool } from "../../config/database.js";

const USER_COLUMNS = `
  id,
  email,
  full_name,
  phone,
  role,
  email_verified_at,
  is_active,
  created_at,
  updated_at
`;

/**
 * =========================================================
 *  FIND USER BY ID
 * =========================================================
 */
export const findUserById = async (id, db = pool) => {
  const { rows } = await db.query(
    `
      SELECT ${USER_COLUMNS}
      FROM public.users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ?? null;
};

/**
 * =========================================================
 *  GET USERS WITH PAGINATION
 * =========================================================
 */
export const findUsers = async ({ limit, offset }, db = pool) => {
  const { rows } = await db.query(
    `
      SELECT ${USER_COLUMNS}
      FROM public.users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );

  return rows;
};

/**
 * =========================================================
 *  COUNT USERS
 * =========================================================
 */
export const countUsers = async (db = pool) => {
  const { rows } = await db.query(
    `
      SELECT COUNT(*)::int AS count
      FROM public.users
    `,
  );

  return rows[0].count;
};

/**
 * =========================================================
 *  UPDATE USER PROFILE
 * =========================================================
 */
export const updateUserProfile = async (id, { fullName, phone }, db = pool) => {
  const { rows } = await db.query(
    `
      UPDATE public.users
      SET
        full_name = COALESCE($2, full_name),
        phone = CASE
          WHEN $3::boolean THEN $4
          ELSE phone
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING ${USER_COLUMNS}
    `,
    [id, fullName ?? null, phone !== undefined, phone ?? null],
  );

  return rows[0] ?? null;
};

/**
 * =========================================================
 *  UPDATE USER ACTIVE STATUS
 * =========================================================
 */
export const updateUserActiveStatus = async (id, isActive, db = pool) => {
  const { rows } = await db.query(
    `
      UPDATE public.users
      SET
        is_active = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING ${USER_COLUMNS}
    `,
    [id, isActive],
  );

  return rows[0] ?? null;
};
