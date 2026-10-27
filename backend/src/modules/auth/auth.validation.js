/**
 * =========================================================
 *  VALIDATE EMAIL FORMAT
 * =========================================================
 */
const isValidEmail = (email) => {
  if (typeof email !== "string" || email.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * =========================================================
 *  VALIDATE REGISTER REQUEST BODY
 * =========================================================
 */
export const validateRegisterBody = (body) => {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return [
      {
        field: "body",
        message: "Request body must be an object.",
      },
    ];
  }

  if (
    typeof body.fullName !== "string" ||
    body.fullName.trim().length < 2 ||
    body.fullName.trim().length > 120
  ) {
    errors.push({
      field: "fullName",
      message: "Full name must be between 2 and 120 characters.",
    });
  }

  if (!isValidEmail(body.email)) {
    errors.push({
      field: "email",
      message: "A valid email address is required.",
    });
  }

  if (
    typeof body.password !== "string" ||
    body.password.length < 12 ||
    body.password.length > 72
  ) {
    errors.push({
      field: "password",
      message: "Password must be between 12 and 72 characters.",
    });
  }

  return errors;
};

/**
 * =========================================================
 *  VALIDATE LOGIN REQUEST BODY
 * =========================================================
 */
export const validateLoginBody = (body) => {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return [
      {
        field: "body",
        message: "Request body must be an object.",
      },
    ];
  }

  if (!isValidEmail(body.email)) {
    errors.push({
      field: "email",
      message: "A valid email address is required.",
    });
  }

  if (
    typeof body.password !== "string" ||
    body.password.length === 0 ||
    body.password.length > 72
  ) {
    errors.push({
      field: "password",
      message: "A valid password is required.",
    });
  }

  return errors;
};
