import ApiError from "./ApiError.js";

const validate = (schema) => (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Request body is missing or empty. Ensure you are sending JSON with 'Content-Type: application/json' header."));
  }

  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.length > 0 ? e.path[0] : "body",
      message: e.message,
    }));
    return next(new ApiError(400, "Validation failed", errors));
  }
  req.body = result.data;
  next();
};

export default validate;