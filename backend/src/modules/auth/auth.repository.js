import { pool } from "../../config/database.js";

const PUBLIC_USER_COLUMNS = `
  id,
  full_name,
  email,
  role,
  is_active,
  created_at,
  updated_at
`;

/**
 * =========================================================
 *  FIND USER BY EMAIL
 * =========================================================
 */
export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  FIND USER BY ID
 * =========================================================
 */
export const findUserById = async (id) => {
  const result = await pool.query(
    `
      SELECT ${PUBLIC_USER_COLUMNS}
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
};

/**
 * =========================================================
 *  CREATE USER
 * =========================================================
 */
export const createUser = async ({ fullName, email, passwordHash }) => {
  const result = await pool.query(
    `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role
      )
      VALUES ($1, $2, $3, 'customer')
      RETURNING ${PUBLIC_USER_COLUMNS}
    `,
    [fullName, email, passwordHash],
  );

  return result.rows[0];
};

/**
 * =========================================================
 *  USER REPOSITORY EXPORT
 * =========================================================
 */
export const userRepository = {
  findUserByEmail,
  findUserById,
  createUser,
};
