// export const errorHandler = (err, req, res, next) => {
//   if (res.headersSent) {
//     return next(err);
//   }

//   const statusCode =
//     Number.isInteger(err.statusCode) &&
//     err.statusCode >= 400 &&
//     err.statusCode <= 599
//       ? err.statusCode
//       : 500;

//   // Internal errors should not expose sensitive information.
//   const message =
//     statusCode >= 500
//       ? "Internal server error."
//       : err.message || "Request failed.";

//   // Log details on the server, not in the response.
//   if (statusCode >= 500) {
//     req.log?.error?.({ err }, "Unhandled application error");
//     console.error("Unhandled application error:", err);
//   } else {
//     req.log?.warn?.({ statusCode, message }, "Request failed");
//   }

//   return res.status(statusCode).json({
//     success: false,
//     message,
//   });
// };

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
      ? err.statusCode
      : 500;

  let message =
    statusCode >= 500
      ? "Internal server error."
      : err.message || "Request failed.";

  // Handle Multer upload errors.
  if (err.name === "MulterError") {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        statusCode = 413;
        message = "Image exceeds the maximum allowed file size.";
        break;

      case "LIMIT_FILE_COUNT":
      case "LIMIT_UNEXPECTED_FILE":
        statusCode = 400;
        message = "Invalid upload fields or file count.";
        break;

      default:
        statusCode = 400;
        message = "Image upload failed validation.";
    }
  }

  // Log details on the server only.
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
