import { ApiError } from "../utils/index.js"

export const errorHandler = (err, req, res, next) => {
  // If the error is already an instance of ApiError → use it as is
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      statusCode: err.statusCode,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    })
  }

  // If not, handle it as an unexpected server error
  console.error("Unhandled Error:", err)

  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    statusCode: 500,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}