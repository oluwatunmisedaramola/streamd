// utils/response.js
export const successResponse = (res, data, metadata = null) => {
  const response = { success: true, data };
  if (metadata) response.metadata = metadata;
  return res.json(response);
};

export const errorResponse = (res, code, message) => {
  return res.status(code).json({
    success: false,
    error: { code, message }
  });
};
