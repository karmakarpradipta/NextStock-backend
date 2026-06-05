import ApiError from "../utils/ApiError.js";

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new ApiError(403, "Forbidden: insufficient permissions"));
  }
  next();
};

export default requireRole;