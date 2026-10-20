export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
      ? err.statusCode
      : 500;

  // Internal errors should not expose sensitive information.
  const message =
    statusCode >= 500
      ? "Internal server error."
      : err.message || "Request failed.";

  // Log details on the server, not in the response.
  if (statusCode >= 500) {
    req.log?.error?.({ err }, "Unhandled application error");
    console.error("Unhandled application error:", err);
  } else {
    req.log?.warn?.({ statusCode, message }, "Request failed");
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
