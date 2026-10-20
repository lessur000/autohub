export const apiResponse = (
  res,
  { statusCode = 200, message = "Success", data = null, meta } = {},
) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};
