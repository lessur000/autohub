export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message, options);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? true;

    Error.captureStackTrace?.(this, AppError);
  }
}
