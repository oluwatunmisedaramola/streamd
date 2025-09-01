import express from "express";
import pool from "../db/pool.js";
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
    await pool.query(
      `INSERT INTO saved_matches (subscriber_id, match_id) VALUES (?, ?)`,
      [subscriber_id, match_id]
    );
    return successResponse(res, null, "Match saved for watch later.");
  } catch (err) {
    return dbErrorHandler(res, err, "saved");
  }
});

// Remove from saved
router.delete("/saved-matches", async (req, res) => {
  const { subscriber_id, match_id } = req.body;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);
  if (!match_id) return errorResponse(res, "match_id is required", 400);

  try {
    const [result] = await pool.query(
      `DELETE FROM saved_matches WHERE subscriber_id = ? AND match_id = ?`,
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

// List saved matches for a subscriber
router.get("/saved-matches", async (req, res) => {
  const { subscriber_id } = req.query;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);

  try {
    const [rows] = await pool.query(
      `SELECT * FROM saved_matches WHERE subscriber_id = ?`,
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
    await pool.query(
      `INSERT INTO loved_matches (subscriber_id, match_id) VALUES (?, ?)`,
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
    const [result] = await pool.query(
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
    const [rows] = await pool.query(
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
    await pool.query(
      `INSERT INTO favorite_matches (subscriber_id, match_id) VALUES (?, ?)`,
      [subscriber_id, match_id]
    );
    return successResponse(res, null, "Match favorited.");
  } catch (err) {
    return dbErrorHandler(res, err, "favorited");
  }
});

// Remove favorite
router.delete("/favorite-matches", async (req, res) => {
  const { subscriber_id, match_id } = req.body;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);
  if (!match_id) return errorResponse(res, "match_id is required", 400);

  try {
    const [result] = await pool.query(
      `DELETE FROM favorite_matches WHERE subscriber_id = ? AND match_id = ?`,
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

// List favorites
router.get("/favorite-matches", async (req, res) => {
  const { subscriber_id } = req.query;
  if (!subscriber_id) return errorResponse(res, "subscriber_id is required", 400);

  try {
    const [rows] = await pool.query(
      `SELECT * FROM favorite_matches WHERE subscriber_id = ?`,
      [subscriber_id]
    );
    return successResponse(res, rows, "Favorite matches retrieved.");
  } catch (err) {
    return dbErrorHandler(res, err, "fetch favorite matches");
  }
});

/**
 * 📊 Get stats for a match
 * GET /api/interactions/matches/:match_id/stats
 */
router.get("/matches/:match_id/stats", async (req, res) => {
  const { match_id } = req.params;

  if (!match_id) {
    return errorResponse(res, "match_id is required", 400);
  }

  try {
    const [rows] = await pool.query(queries.getMatchStats, [match_id, match_id, match_id]);

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
 * GET /api/interactions/subscribers/:subscriber_id/stats
 */
router.get("/subscribers/:subscriber_id/stats", async (req, res) => {
  const { subscriber_id } = req.params;

  if (!subscriber_id) {
    return errorResponse(res, "subscriber_id is required", 400);
  }

  try {
    const [rows] = await pool.query(queries.getSubscriberStats, [
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
  const limit = 10; // default limit, no query param needed

  try {
    // 1. Use centralized totals query
    const [counts] = await pool.query(queries.getInteractionTotals);

    // 2. Pick winner
    let winner = counts[0];
    for (const row of counts) {
      if (row.total > winner.total) {
        winner = row;
      }
    }

    // 3. Choose query dynamically
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
        return successResponse(res, { rows: [] }, "No interactions found.");
    }

    // 4. Execute and return
    const [rows] = await pool.query(query, [limit]);

    return successResponse(
      res,
      { type: winner.type, rows },
      `Top ${limit} ${winner.type} matches retrieved successfully.`
    );

  } catch (err) {
    return dbErrorHandler(res, err, "fetch top matches");
  }
});

export default router;
