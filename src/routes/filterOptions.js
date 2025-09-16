import express from "express";
import { safeQuery } from "../db/pool.js";
import { queries } from "../db/queries.js";
import { successResponse, errorResponse, dbErrorHandler } from "../utils/interactionResponse.js";

const router = express.Router();

router.get("/filter-options", async (req, res) => {
  const { type, q = "", limit = 10, offset = 0 } = req.query;

  try {
    // ✅ Static options → return in `{ id, name }` shape
    if (type === "match_status") {
      return successResponse(res, {
        type,
        query: q,
        options: [
          { id: "upcoming", name: "Upcoming" },
          { id: "finished", name: "Finished" },
          { id: "live", name: "Live" }
        ],
        total: 3
      });
    }

    if (type === "category") {
      return successResponse(res, {
        type,
        query: q,
        options: [
          { id: "All Goals", name: "All Goals" },
          { id: "Highlights", name: "Highlights" },
          { id: "Extended Highlights", name: "Extended Highlights" },
          { id: "Live Stream", name: "Live Stream" }
        ],
        total: 4
      });
    }

    // ✅ Dynamic queries for team / league / location
    let sql;
    switch (type) {
      case "team":
        sql = queries.getTeamsByName;
        break;
      case "league":
        sql = queries.getLeaguesByName;
        break;
      case "location": // still called "location" in API
        sql = queries.getLocationsByName; // internally queries countries
        break;
      default:
        return errorResponse(res, "Invalid filter type", 400);
    }

    // ✅ Pass `q` twice → MATCH + LIKE fallback
    const [rows] = await safeQuery(sql, [q, q, Number(limit), Number(offset)]);

    // ✅ Return consistent shape `{ id, name }`
    return successResponse(res, {
      type,
      query: q,
      options: rows.map(row => ({
        id: row.id,
        name: row.name
      })),
      total: rows.length
    });

  } catch (err) {
    return dbErrorHandler(res, err, "fetch filter options");
  }
});

export default router;
