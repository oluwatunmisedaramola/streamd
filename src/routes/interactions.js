import express from "express";
import { safeQuery } from "../db/pool.js"; // ⚡ CHANGED: replaced pool import
import { queries } from "../db/queries.js";
import { successResponse, errorResponse, dbErrorHandler } from "../utils/interactionResponse.js";

const router = express.Router();

/* -------------------------
   SAVED MATCHES
--------------------------*/

// Save a match
router.post("/saved-matches", async (req, res) => {
  const { subscriber_id, match_id } = req.body;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);
  if (!match_id) return errorResponse(res, "match_id is required", 400);

  try {
    await safeQuery(
      `INSERT INTO saved_matches (subscriber_id, match_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE 
         deleted_at = NULL, 
         saved_at = NOW()`, // ⚡ UPDATED for soft delete
      [subscriber_id, match_id]
    );
    return successResponse(res, null, "Match saved for watch later.");
  } catch (err) {
    return dbErrorHandler(res, err, "saved");
  }
});

// Remove from saved (soft delete)
router.delete("/saved-matches", async (req, res) => {
  const { subscriber_id, match_id } = req.body;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);
  if (!match_id) return errorResponse(res, "match_id is required", 400);

  try {
    const [result] = await safeQuery(
      `UPDATE saved_matches
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE subscriber_id = ? AND match_id = ? AND deleted_at IS NULL`, // ⚡ UPDATED: soft delete
      [subscriber_id, match_id]
    );
    if (result.affectedRows === 0) {
      return errorResponse(res, "Saved match not found", 404);
    }
    return successResponse(res, null, "Match removed from saved.");
  } catch (err) {
    return dbErrorHandler(res, err, "remove saved match");
  }
});

// List saved matches (only active ones)
router.get("/saved-matches", async (req, res) => {
  const { subscriber_id } = req.query;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);

  try {
    const [rows] = await safeQuery(
      `SELECT * FROM saved_matches WHERE subscriber_id = ? AND deleted_at IS NULL`, // ⚡ UPDATED filter
      [subscriber_id]
    );
    return successResponse(res, rows, "Saved matches retrieved.");
  } catch (err) {
    return dbErrorHandler(res, err, "fetch saved matches");
  }
});

/* -------------------------
   LOVED MATCHES
--------------------------*/

// Love a match
router.post("/loved-matches", async (req, res) => {
  const { subscriber_id, match_id } = req.body;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);
  if (!match_id) return errorResponse(res, "match_id is required", 400);

  try {
    await safeQuery(
      `INSERT INTO loved_matches (subscriber_id, match_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE 
         deleted_at = NULL,
         loved_at = NOW()`, // ⚡ UPDATED for soft delete
      [subscriber_id, match_id]
    );
    return successResponse(res, null, "Match loved.");
  } catch (err) {
    return dbErrorHandler(res, err, "loved");
  }
});

// Unlove a match (soft delete)
router.delete("/loved-matches", async (req, res) => {
  const { subscriber_id, match_id } = req.body;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);
  if (!match_id) return errorResponse(res, "match_id is required", 400);

  try {
    const [result] = await safeQuery( // ⚡ CHANGED
      `UPDATE loved_matches
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE subscriber_id = ? AND match_id = ? AND deleted_at IS NULL`,
      [subscriber_id, match_id]
    );
    if (result.affectedRows === 0) {
      return errorResponse(res, "Loved match not found", 404);
    }
    return successResponse(res, null, "Love removed.");
  } catch (err) {
    return dbErrorHandler(res, err, "remove love");
  }
});

// List loved matches
router.get("/loved-matches", async (req, res) => {
  const { subscriber_id } = req.query;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);

  try {
    const [rows] = await safeQuery( // ⚡ CHANGED
      `SELECT * FROM loved_matches WHERE subscriber_id = ? AND deleted_at IS NULL`,
      [subscriber_id]
    );
    return successResponse(res, rows, "Loved matches retrieved.");
  } catch (err) {
    return dbErrorHandler(res, err, "fetch loved matches");
  }
});

/* -------------------------
   FAVORITE MATCHES
--------------------------*/

// Favorite a match
router.post("/favorite-matches", async (req, res) => {
  const { subscriber_id, match_id } = req.body;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);
  if (!match_id) return errorResponse(res, "match_id is required", 400);

  try {
    await safeQuery(
      `INSERT INTO favorite_matches (subscriber_id, match_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE 
         deleted_at = NULL,
         favorited_at = NOW()`, // ⚡ UPDATED for soft delete
      [subscriber_id, match_id]
    );
    return successResponse(res, null, "Match favorited.");
  } catch (err) {
    return dbErrorHandler(res, err, "favorited");
  }
});

// Remove favorite (soft delete)
router.delete("/favorite-matches", async (req, res) => {
  const { subscriber_id, match_id } = req.body;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);
  if (!match_id) return errorResponse(res, "match_id is required", 400);

  try {
    const [result] = await safeQuery(
      `UPDATE favorite_matches
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE subscriber_id = ? AND match_id = ? AND deleted_at IS NULL`, // ⚡ UPDATED: soft delete
      [subscriber_id, match_id]
    );
    if (result.affectedRows === 0) {
      return errorResponse(res, "Favorite match not found", 404);
    }
    return successResponse(res, null, "Match removed from favorites.");
  } catch (err) {
    return dbErrorHandler(res, err, "remove favorite");
  }
});

// List favorites (only active ones)
router.get("/favorite-matches", async (req, res) => {
  const { subscriber_id } = req.query;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);

  try {
    const [rows] = await safeQuery(
      `SELECT * FROM favorite_matches WHERE subscriber_id = ? AND deleted_at IS NULL`, // ⚡ UPDATED filter
      [subscriber_id]
    );
    return successResponse(res, rows, "Favorite matches retrieved.");
  } catch (err) {
    return dbErrorHandler(res, err, "fetch favorite matches");
  }
});

/**
 * 📊 Get stats for a match
 */
router.get("/matches/:match_id/stats", async (req, res) => {
  const { match_id } = req.params;

  if (!match_id) {
    return errorResponse(res, "match_id is required", 400);
  }

  try {
    const [rows] = await safeQuery(queries.getMatchStats, [match_id, match_id, match_id]); // ⚡ CHANGED

    if (!rows || rows.length === 0) {
      return errorResponse(res, "No stats found for this match", 404);
    }

    return successResponse(res, rows[0], "Match stats fetched successfully");
  } catch (err) {
    return dbErrorHandler(res, err, "fetch match stats");
  }
});

/**
 * 📊 Get stats for a subscriber
 */
router.get("/subscribers/:subscriber_id/stats", async (req, res) => {
  const { subscriber_id } = req.params;

  if (!subscriber_id) {
    return errorResponse(res, "subscriber_id is required", 400);
  }

  try {
    const [rows] = await safeQuery(queries.getSubscriberStats, [ // ⚡ CHANGED
      subscriber_id,
      subscriber_id,
      subscriber_id,
    ]);

    if (!rows || rows.length === 0) {
      return errorResponse(res, "No stats found for this subscriber", 404);
    }

    return successResponse(res, rows[0], "Subscriber stats fetched successfully");
  } catch (err) {
    return dbErrorHandler(res, err, "fetch subscriber stats");
  }
});


router.get("/top", async (req, res) => {
  const limit = 10;

  try {
    const [counts] = await safeQuery(queries.getInteractionTotals); // ⚡ CHANGED

    let winner = counts[0];
    for (const row of counts) {
      if (row.total > winner.total) {
        winner = row;
      }
    }

    let query;
    switch (winner.type) {
      case "favorite":
        query = queries.getTopFavoritedMatches;
        break;
      case "loved":
        query = queries.getTopLovedMatches;
        break;
      case "saved":
        query = queries.getTopSavedMatches;
        break;
      default:
        return successResponse(res, { best_matches: [] }, "No interactions found.");
    }

    const [best_matches] = await safeQuery(query, [limit]); // ⚡ CHANGED

    return successResponse(
      res,
      { type: winner.type, best_matches },
      `Top ${limit} ${winner.type} matches retrieved successfully.`
    );

  } catch (err) {
    return dbErrorHandler(res, err, "fetch top matches");
  }
});

export default router;
