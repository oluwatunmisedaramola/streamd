import { errorResponse } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
  console.error(err); // log for debugging
  return errorResponse(res, 500, "Internal Server Error");
};
