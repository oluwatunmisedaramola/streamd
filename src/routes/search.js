import express from "express";
import { safeQuery } from "../db/pool.js";
import { queries } from "../db/queries.js";
import { successResponse, dbErrorHandler } from "../utils/interactionResponse.js";

// Debug utility: interpolate params into SQL for logging
function formatSQL(sql, params) {
  let i = 0;
  return sql.replace(/\?/g, () => {
    const param = params[i++];
    if (typeof param === "string") return `'${param}'`;
    if (param === null || param === undefined) return "NULL";
    return param;
  });
}


const router = express.Router();

router.get("/search", async (req, res) => {
  const { q, league, team, category, location, match_status, date, page = 1, limit = 20 } = req.query;

  const validCategories = ["All Goals", "Highlights", "Extended Highlights", "Live Stream"];

  const filters = {
    q,
    league: Array.isArray(league) ? league : league ? [league] : [],
    team: Array.isArray(team) ? team : team ? [team] : [],
    category: Array.isArray(category)
      ? category.filter(c => validCategories.includes(c))
      : category && validCategories.includes(category)
        ? [category]
        : [],
    // ✅ location stays flexible but internally maps to countries
    location: Array.isArray(location) ? location : location ? [location] : [],
    match_status,
    date,
    limit: Number(limit),
    offset: (page - 1) * limit
  };

  try {
    const { sql, params } = queries.buildSearchQuery(filters);
     console.log("Final SQL:\n", formatSQL(sql, params));
    console.log("Params:", params);
    const [rows] = await safeQuery(sql, params);
    const total = rows.length > 0 ? rows[0].total_count : 0;

    return successResponse(res, {
      query: q,
      filters,
      results: rows,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (err) {
    return dbErrorHandler(res, err, "search");
  }
});

export default router;
