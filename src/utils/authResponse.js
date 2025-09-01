export const successResponse = (res, data = {}, message = "Success", status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    server_time: new Date().toISOString(), // 🕒 always include server timestamp
  });
};

export const errorResponse = (res, error = "Something went wrong", status = 500) => {
  return res.status(status).json({
    success: false,
    message: error,
    server_time: new Date().toISOString(),
  });
};

/**
 * Database error handler
 * Maps duplicate entry → 409 Conflict
 */
export const dbErrorHandler = (res, err, action = "perform action") => {
  if (err.code === "ER_DUP_ENTRY") {
    return errorResponse(res, `Already ${action}`, 409); // 409 Conflict
  }
  return errorResponse(res, err.message, 500);
};
