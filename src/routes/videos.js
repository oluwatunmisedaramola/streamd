import express from "express";
import pool from "../db/pool.js";
import { queries } from "../db/queries.js";
import { DateTime } from "luxon";

const router = express.Router();

// GET /api/videos/category/:categoryName
router.get("/category/:categoryName", async (req, res, next) => {
  const { categoryName } = req.params;
  const { page = 1, pageSize = 10, sort = "DESC" } = req.query;

  try {
    const [rows] = await pool.query(
      queries.getVideosByCategory(sort),
      [categoryName, Number(pageSize), (page - 1) * pageSize]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/videos/category/:categoryName/date/:filter
router.get("/category/:categoryName/date/:filter", async (req, res, next) => {
  const { categoryName, filter } = req.params;
  const { page = 1, pageSize = 10, sort = "DESC", tz = "Africa/Lagos" } = req.query;

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
    return res.status(400).json({ error: "Invalid filter. Use yesterday|today|tomorrow" });
  }

  try {
    const [rows] = await pool.query(
      queries.getVideosByCategoryAndDate(sort),
      [categoryName, start.toFormat("yyyy-MM-dd"), end.toFormat("yyyy-MM-dd"), Number(pageSize), (page - 1) * pageSize]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});


// ✅ Old: GET /api/videos/date?from=YYYY-MM-DD&to=YYYY-MM-DD[&category=...]
router.get("/date", async (req, res, next) => {
  const { from, to, category, page = 1, pageSize = 10, sort = "DESC" } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: "Missing 'from' or 'to' query params" });
  }

  try {
    const sql = queries.getVideosByDateRange(!!category, sort);
    const params = category
      ? [from, to, category, Number(pageSize), (page - 1) * pageSize]
      : [from, to, Number(pageSize), (page - 1) * pageSize];

    const [rows] = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ✅ Old: GET /api/videos/:id
router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(queries.getVideoById, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Video not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ✅ New: GET /api/videos (all videos, paginated)
router.get("/", async (req, res, next) => {
  const { page = 1, pageSize = 10, sort = "DESC" } = req.query;

  try {
    const [rows] = await pool.query(
      queries.getAllVideos(sort),
      [Number(pageSize), (page - 1) * pageSize]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});


export default router;
