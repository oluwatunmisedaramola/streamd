export const successResponse = (res, data = {}, message = "Success", status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, error = "Something went wrong", status = 500) => {
  return res.status(status).json({
    success: false,
    message: error,
  });
};

/**
 * Database error handler
 * Maps duplicate entry → 409 Conflict
 */
export const dbErrorHandler = (res, err, action = "perform action") => {
  if (err.code === "ER_DUP_ENTRY") {
    return errorResponse(res, `Match already ${action}`, 409); // 409 Conflict
  }
  return errorResponse(res, err.message, 500);
};
