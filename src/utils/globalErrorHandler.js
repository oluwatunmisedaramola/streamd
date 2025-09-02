export default function globalErrorHandler(err, req, res, next) {
  // Log full details for debugging
  console.error("GlobalErrorHandler caught an error:", {
    message: err.message,
    code: err.code,
    errno: err.errno,
    sql: err.sql,
    stack: err.stack,
  });

  const statusCode = err.status || 500;
  let message;
  let retryable = false;

  if (err.code === "ECONNRESET" || err.code === "PROTOCOL_CONNECTION_LOST") {
    message = "Database connection was interrupted. Please retry your request.";
    retryable = true;
  } else if (err.code && err.code.startsWith("ER_")) {
    message = "A database error occurred.";
  } else if (statusCode >= 400 && statusCode < 500) {
    message = err.message || "Invalid request.";
  } else {
    message = "Internal Server Error";
  }

  const responsePayload = { success: false, message };
  if (retryable) responsePayload.retry = true;

  res.status(statusCode).json(responsePayload);
}
