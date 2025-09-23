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
    location: Array.isArray(location) ? location : location ? [location] : [],
    match_status,
    date,
    limit: Number(limit),
    offset: (page - 1) * limit
  };

  // 🔹 NEW: autosuggest mode requires q length < 4
  const isAutosuggest =
    !!q && q.length < 4 && // only short queries trigger autosuggest
    !league && !team && !category && !location && !match_status && !date;

  try {
    let { sql, params } = queries.buildSearchQuery(filters, "NATURAL", isAutosuggest);
    let [rows] = await safeQuery(sql, params);

    // autosuggest response
    if (isAutosuggest) {
      const results = rows.map(r => ({
        name: r.team || r.league || r.country,
        type: r.type
      }));

      return successResponse(res, {
        query: q || "",
        results
      });
    }

    // retry in BOOLEAN mode if NATURAL returns nothing
    if ((!rows || rows.length === 0) && filters.q) {
      ({ sql, params } = queries.buildSearchQuery(filters, "BOOLEAN"));
      [rows] = await safeQuery(sql, params);
    }

    const total = rows.length > 0 ? rows[0].total_count : 0;

    // Clean shape for full search
    const results = rows.map(
      ({ total_count, team, ...rest }) => ({
        id: rest.id,
        title: rest.title,
        match_id: rest.match_id,
        thumbnail: rest.thumbnail,
        category: rest.category,
        match_date: rest.match_date,
        league: rest.league,
        country: rest.country,
        video_url: rest.video_url
      })
    );

    return successResponse(res, {
      query: q || "",
      filters,
      results,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (err) {
    return dbErrorHandler(res, err, "search");
  }
});

export default router;
