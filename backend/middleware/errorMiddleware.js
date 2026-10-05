const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.conflict && { conflict: err.conflict }),
      ...(err.errors.length > 0 && { errors: err.errors }),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};

module.exports = { errorHandler };