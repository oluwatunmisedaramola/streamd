import express from "express";
import { safeQuery } from "../db/pool.js"; // ⚡ CHANGED: replaced direct pool import
import { queries } from "../db/queries.js";
import { DateTime } from "luxon";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

const buildMetadata = (total, page, pageSize) => ({
  total_items: total,
  page,
  pageSize,
  total_pages: Math.ceil(total / pageSize),
  has_previous: page > 1,
  has_next: page * pageSize < total,
  previous_page: page > 1 ? page - 1 : null,
  next_page: page * pageSize < total ? page + 1 : null,
});

// -------------------------
// STATIC & SPECIFIC ROUTES
// -------------------------

router.get("/recent", async (req, res, next) => {
  const { page = 1, pageSize = 10, sort = "DESC" } = req.query;

  try {
    const [[{ total }]] = await safeQuery(queries.countRecentHighlights); // ⚡ CHANGED

    if (total === 0) {
      return successResponse(res, [], buildMetadata(0, Number(page), Number(pageSize)));
    }

    const [rows] = await safeQuery(queries.getRecentHighlights(sort), [ // ⚡ CHANGED
      Number(pageSize),
      (page - 1) * pageSize,
    ]);

    return successResponse(res, rows, buildMetadata(total, Number(page), Number(pageSize)));
  } catch (err) {
    next(err);
  }
});

router.get("/date", async (req, res, next) => {
  const { from, to, category, page = 1, pageSize = 10, sort = "DESC" } = req.query;
  const cappedPageSize = Math.min(Number(pageSize), 100);

  if (!from || !to) {
    return errorResponse(res, 400, "Missing 'from' or 'to' query params");
  }

  try {
    let totalQuery, params, sql;

    if (category) {
      totalQuery = queries.countVideosByDateAndCategory;
      sql = queries.getVideosByDateRange(true, sort);
      params = [from, to, category, cappedPageSize, (page - 1) * cappedPageSize];
    } else {
      totalQuery = queries.countVideosByDate;
      sql = queries.getVideosByDateRange(false, sort);
      params = [from, to, cappedPageSize, (page - 1) * cappedPageSize];
    }

    const [[{ total }]] = await safeQuery( // ⚡ CHANGED
      totalQuery,
      category ? [from, to, category] : [from, to]
    );
    const [rows] = await safeQuery(sql, params); // ⚡ CHANGED

    return successResponse(res, rows, buildMetadata(total, Number(page), cappedPageSize));
  } catch (err) {
    next(err);
  }
});

router.get("/category/:categoryName", async (req, res, next) => {
  const { categoryName } = req.params;
  const { page = 1, pageSize = 10, sort = "DESC" } = req.query;
  const cappedPageSize = Math.min(Number(pageSize), 100);

  try {
    const [[{ total }]] = await safeQuery(queries.countVideosByCategory, [categoryName]); // ⚡ CHANGED

    const [rows] = await safeQuery(queries.getVideosByCategory(sort), [ // ⚡ CHANGED
      categoryName,
      cappedPageSize,
      (page - 1) * cappedPageSize,
    ]);

    return successResponse(res, rows, buildMetadata(total, Number(page), cappedPageSize));
  } catch (err) {
    next(err);
  }
});

router.get("/category/:categoryName/date/:filter", async (req, res, next) => {
  const { categoryName, filter } = req.params;
  const { page = 1, pageSize = 10, sort = "DESC", tz = "Africa/Lagos" } = req.query;
  const cappedPageSize = Math.min(Number(pageSize), 100);

  const now = DateTime.now().setZone(tz);
  let start, end;

  if (filter === "yesterday") {
    start = now.minus({ days: 1 }).startOf("day");
    end = now.minus({ days: 1 }).endOf("day");
  } else if (filter === "today") {
    start = now.startOf("day");
    end = now.endOf("day");
  } else if (filter === "tomorrow") {
    start = now.plus({ days: 1 }).startOf("day");
    end = now.plus({ days: 1 }).endOf("day");
  } else {
    return errorResponse(res, 400, "Invalid filter. Use yesterday|today|tomorrow");
  }

  try {
    const [[{ total }]] = await safeQuery(queries.countVideosByCategoryAndDate, [ // ⚡ CHANGED
      categoryName,
      start.toFormat("yyyy-MM-dd"),
      end.toFormat("yyyy-MM-dd"),
    ]);

    const [rows] = await safeQuery(queries.getVideosByCategoryAndDate(sort), [ // ⚡ CHANGED
      categoryName,
      start.toFormat("yyyy-MM-dd"),
      end.toFormat("yyyy-MM-dd"),
      cappedPageSize,
      (page - 1) * cappedPageSize,
    ]);

    return successResponse(res, rows, buildMetadata(total, Number(page), cappedPageSize));
  } catch (err) {
    next(err);
  }
});

router.get("/category/:categoryName/date", async (req, res, next) => {
  const { categoryName } = req.params;
  const { from, to, page = 1, pageSize = 10, sort = "DESC" } = req.query;
  const cappedPageSize = Math.min(Number(pageSize), 100);

  if (!from || !to) {
    return errorResponse(res, 400, "Missing 'from' or 'to' query params");
  }

  try {
    const [[{ total }]] = await safeQuery(queries.countVideosByCategoryAndDate, [ // ⚡ CHANGED
      categoryName,
      from,
      to,
    ]);

    const [rows] = await safeQuery(queries.getVideosByCategoryAndDate(sort), [ // ⚡ CHANGED
      categoryName,
      from,
      to,
      cappedPageSize,
      (page - 1) * cappedPageSize,
    ]);

    return successResponse(res, rows, buildMetadata(total, Number(page), cappedPageSize));
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  const { page = 1, pageSize = 10, sort = "DESC" } = req.query;
  const cappedPageSize = Math.min(Number(pageSize), 100);

  try {
    const [[{ total }]] = await safeQuery(queries.countAllVideos); // ⚡ CHANGED
    const [rows] = await safeQuery(queries.getAllVideos(sort), [ // ⚡ CHANGED
      cappedPageSize,
      (page - 1) * cappedPageSize,
    ]);

    return successResponse(res, rows, buildMetadata(total, Number(page), cappedPageSize));
  } catch (err) {
    next(err);
  }
});

// -------------------------
// DYNAMIC ROUTES
// -------------------------

router.get("/:id/related", async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 5;

    const [related] = await safeQuery(queries.getRelatedVideos, [id, id, limit]); // ⚡ CHANGED

    if (!related.length) {
      return errorResponse(res, 404, `No related videos found for video ${id}`);
    }

    return successResponse(res, related);
  } catch (err) {
    return errorResponse(res, 500, "An unexpected error occurred while fetching related videos.");
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await safeQuery(queries.getVideoById, [req.params.id]); // ⚡ CHANGED
    if (!rows.length) return errorResponse(res, 404, "Video not found");
    return successResponse(res, rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
