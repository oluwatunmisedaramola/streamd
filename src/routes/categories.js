import express from "express";
import { safeQuery } from "../db/pool.js";
import { queries } from "../db/queries.js";

const router = express.Router();

// GET /api/categories
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await safeQuery(queries.getCategories);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
