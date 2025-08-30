import express from "express";
import pool from "../db/pool.js";
import { queries } from "../db/queries.js";
import { DateTime } from "luxon";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

// Helper to build pagination metadata
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
// GET /api/videos/category/:categoryName
// -------------------------
router.get("/category/:categoryName", async (req, res, next) => {
  const { categoryName } = req.params;
  const { page = 1, pageSize = 10, sort = "DESC" } = req.query;

  // ✅ CAP pageSize here
  const cappedPageSize = Math.min(Number(pageSize), 100);

  try {
    const [[{ total }]] = await pool.query(
      queries.countVideosByCategory,
      [categoryName]
    );

    const [rows] = await pool.query(
      queries.getVideosByCategory(sort),
      [categoryName, cappedPageSize, (page - 1) * cappedPageSize]
    );

    return successResponse(
      res,
      rows,
      buildMetadata(total, Number(page), cappedPageSize) // ✅ use cappedPageSize
    );
  } catch (err) {
    next(err);
  }
});

// -------------------------
// GET /api/videos/category/:categoryName/date/:filter
// -------------------------
router.get("/category/:categoryName/date/:filter", async (req, res, next) => {
  const { categoryName, filter } = req.params;
  const { page = 1, pageSize = 10, sort = "DESC", tz = "Africa/Lagos" } =
    req.query;

  // ✅ CAP pageSize
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
    const [[{ total }]] = await pool.query(
      queries.countVideosByCategoryAndDate,
      [categoryName, start.toFormat("yyyy-MM-dd"), end.toFormat("yyyy-MM-dd")]
    );

    const [rows] = await pool.query(queries.getVideosByCategoryAndDate(sort), [
      categoryName,
      start.toFormat("yyyy-MM-dd"),
      end.toFormat("yyyy-MM-dd"),
      cappedPageSize,
      (page - 1) * cappedPageSize,
    ]);

    return successResponse(
      res,
      rows,
      buildMetadata(total, Number(page), cappedPageSize)
    );
  } catch (err) {
    next(err);
  }
});

// -------------------------
// GET /api/videos/category/:categoryName/date
// -------------------------
router.get("/category/:categoryName/date", async (req, res, next) => {
  const { categoryName } = req.params;
  const { from, to, page = 1, pageSize = 10, sort = "DESC" } = req.query;

  // ✅ CAP pageSize
  const cappedPageSize = Math.min(Number(pageSize), 100);

  if (!from || !to) {
    return errorResponse(res, 400, "Missing 'from' or 'to' query params");
  }

  try {
    const [[{ total }]] = await pool.query(
      queries.countVideosByCategoryAndDate,
      [categoryName, from, to]
    );

    const [rows] = await pool.query(queries.getVideosByCategoryAndDate(sort), [
      categoryName,
      from,
      to,
      cappedPageSize,
      (page - 1) * cappedPageSize,
    ]);

    return successResponse(
      res,
      rows,
      buildMetadata(total, Number(page), cappedPageSize)
    );
  } catch (err) {
    next(err);
  }
});

// -------------------------
// GET /api/videos/date
// -------------------------
router.get("/date", async (req, res, next) => {
  const { from, to, category, page = 1, pageSize = 10, sort = "DESC" } =
    req.query;

  // ✅ CAP pageSize
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

    const [[{ total }]] = await pool.query(
      totalQuery,
      category ? [from, to, category] : [from, to]
    );
    const [rows] = await pool.query(sql, params);

    return successResponse(
      res,
      rows,
      buildMetadata(total, Number(page), cappedPageSize)
    );
  } catch (err) {
    next(err);
  }
});

// -------------------------
// GET /api/videos/:id
// -------------------------
router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(queries.getVideoById, [req.params.id]);
    if (!rows.length) return errorResponse(res, 404, "Video not found");
    return successResponse(res, rows[0]);
  } catch (err) {
    next(err);
  }
});

// -------------------------
// GET /api/videos
// -------------------------
router.get("/", async (req, res, next) => {
  const { page = 1, pageSize = 10, sort = "DESC" } = req.query;

  // ✅ CAP pageSize
  const cappedPageSize = Math.min(Number(pageSize), 100);

  try {
    const [[{ total }]] = await pool.query(queries.countAllVideos);
    const [rows] = await pool.query(queries.getAllVideos(sort), [
      cappedPageSize,
      (page - 1) * cappedPageSize,
    ]);

    return successResponse(
      res,
      rows,
      buildMetadata(total, Number(page), cappedPageSize)
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/videos/recent
router.get("/recent", async (req, res, next) => {
  const { page = 1, pageSize = 10, sort = "DESC" } = req.query;

  try {
    // Count
    const [[{ total }]] = await pool.query(queries.countRecentHighlights);

    // If no highlights, return empty array with metadata
    if (total === 0) {
      return successResponse(res, [], buildMetadata(0, Number(page), Number(pageSize)));
    }

    // Fetch recent highlights
    const [rows] = await pool.query(queries.getRecentHighlights(sort), [
      Number(pageSize),
      (page - 1) * pageSize,
    ]);

    return successResponse(
      res,
      rows,
      buildMetadata(total, Number(page), Number(pageSize))
    );
  } catch (err) {
    next(err);
  }
});


// GET /api/videos/:id/related
router.get("/:id/related", async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 5;

    const [related] = await pool.query(queries.getRelatedVideos, [id, id, limit]);

    if (!related.length) {
      return res.status(404).json({ error: `No related videos found for video ${id}` });
    }

    res.json({ data: related });
  } catch (err) {
    next(err);
  }
});



export default router;
