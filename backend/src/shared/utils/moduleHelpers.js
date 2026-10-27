/**
 * =========================================================
 *  AUTOHUB MODULE HELPERS
 * =========================================================
 */

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * =========================================================
 *  VALIDATE UUID
 * =========================================================
 */
export const isUuid = (value) => {
  return typeof value === "string" && UUID_PATTERN.test(value);
};

/**
 * =========================================================
 *  PAGINATION
 * =========================================================
 */
export const parsePagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);

  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20),
  );

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

/**
 * =========================================================
 *  GENERATE SLUG
 * =========================================================
 */
export const makeSlug = (value) => {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * =========================================================
 *  PUBLIC USER RESPONSE
 * =========================================================
 */
export const publicUser = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    emailVerifiedAt: row.email_verified_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * =========================================================
 *  HTTP ERROR
 * =========================================================
 */
export const httpError = (statusCode, message, code) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  if (code) {
    error.code = code;
  }

  return error;
};

/**
 * =========================================================
 *  API SUCCESS RESPONSE
 * =========================================================
 */
export const sendSuccess = (
  res,
  data,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * =========================================================
 *  ASYNC CONTROLLER HANDLER
 * =========================================================
 */
export const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
