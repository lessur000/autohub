export const validateRequest = ({ body, params, query }) => {
  const schemas = { body, params, query };

  return (req, res, next) => {
    const errors = [];

    for (const [source, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      let result;

      // Zod schema
      if (typeof schema.safeParse === "function") {
        result = schema.safeParse(req[source]);

        if (!result.success) {
          errors.push(
            ...result.error.issues.map((issue) => ({
              source,
              field: issue.path.join("."),
              message: issue.message,
            })),
          );
        } else if (source === "body") {
          req.body = result.data;
        }

        continue;
      }

      // Joi schema
      if (typeof schema.validate === "function") {
        const { error, value } = schema.validate(req[source], {
          abortEarly: false,
          convert: true,
          stripUnknown: false,
        });

        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              source,
              field: detail.path.join("."),
              message: detail.message,
            })),
          );
        } else if (source === "body") {
          req.body = value;
        }

        continue;
      }

      return next(
        new TypeError(`Unsupported validation schema for ${source}.`),
      );
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Request validation failed.",
        errors,
      });
    }

    return next();
  };
};
