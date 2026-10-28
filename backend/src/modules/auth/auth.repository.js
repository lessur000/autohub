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
  email_verified_at,
  created_at,
  updated_at
FROM public.users
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
export const createUser = async ({ fullName, email, passwordHash, phone }) => {
  const result = await pool.query(
    `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        phone,
        role
      )
      VALUES ($1, $2, $3, $4, 'customer')
      RETURNING ${PUBLIC_USER_COLUMNS}
    `,
    [fullName, email, passwordHash, phone],
  );

  return result.rows[0];
};

/**
 * =========================================================
 * PASSWORD RESET TOKEN REPOSITORY METHODS
 * =========================================================
 */

export const createPasswordResetToken = async ({
  userId,
  tokenHash,
  expiresAt,
}) => {
  const result = await pool.query(
    `
      INSERT INTO public.password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [userId, tokenHash, expiresAt],
  );

  return result.rows[0];
};

export const resetPasswordWithToken = async (tokenHash, passwordHash) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        SELECT id, user_id
        FROM public.password_reset_tokens
        WHERE token_hash = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
        FOR UPDATE
      `,
      [tokenHash],
    );

    const token = result.rows[0];

    if (!token) {
      await client.query("ROLLBACK");
      return false;
    }

    const userResult = await client.query(
      `
        UPDATE public.users
        SET password_hash = $2,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [token.user_id, passwordHash],
    );

    if (userResult.rowCount !== 1) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(
      `
        UPDATE public.password_reset_tokens
        SET used_at = NOW()
        WHERE user_id = $1
          AND used_at IS NULL
      `,
      [token.user_id],
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * CREATE EMAIL VERIFICATION TOKEN
 */
export const createEmailVerificationToken = async ({
  userId,
  tokenHash,
  expiresAt,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Invalidate previous unused verification tokens.
    await client.query(
      `
        UPDATE public.email_verification_tokens
        SET used_at = NOW()
        WHERE user_id = $1
          AND used_at IS NULL
      `,
      [userId],
    );

    const result = await client.query(
      `
        INSERT INTO public.email_verification_tokens (
          user_id,
          token_hash,
          expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [userId, tokenHash, expiresAt],
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * VERIFY EMAIL USING A ONE-TIME TOKEN
 */
export const verifyEmailWithToken = async (tokenHash) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `
        SELECT id, user_id
        FROM public.email_verification_tokens
        WHERE token_hash = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
        FOR UPDATE
      `,
      [tokenHash],
    );

    const token = tokenResult.rows[0];

    if (!token) {
      await client.query("ROLLBACK");
      return false;
    }

    const userResult = await client.query(
      `
        UPDATE public.users
        SET
          email_verified_at = COALESCE(email_verified_at, NOW()),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [token.user_id],
    );

    if (userResult.rowCount !== 1) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(
      `
        UPDATE public.email_verification_tokens
        SET used_at = NOW()
        WHERE id = $1
      `,
      [token.id],
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
  createPasswordResetToken,
  resetPasswordWithToken,
  createEmailVerificationToken,
  verifyEmailWithToken,
};
