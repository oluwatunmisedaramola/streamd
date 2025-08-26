import express from "express";
import pool from "./db.js";

const app = express();
app.use(express.json());

// ---- Routes ----


// Health check endpoint
app.get("/healthz", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [row] = await conn.query("SELECT NOW() AS now");
    conn.release();

    res.json({
      status: "ok",
      dbTime: row.now,
    });
  } catch (err) {
    console.error("❌ Health check DB error:", err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// List all categories
app.get("/categories", async (req, res) => {
  try {
    const rows = await pool.query("SELECT id, name FROM categories");
    res.json(rows);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get videos (optionally filter by category name)
app.get("/videos", async (req, res) => {
  const category = req.query.category?.toLowerCase();
  try {
    let rows;
    if (category) {
      rows = await pool.query(
        `SELECT v.* FROM videos v
         JOIN categories c ON v.category_id = c.id
         WHERE LOWER(c.name) = ?`,
        [category]
      );
    } else {
      rows = await pool.query("SELECT * FROM videos");
    }
    res.json(rows);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get videos for a specific match (with optional category filter)
app.get("/matches/:matchId/videos", async (req, res) => {
  const { matchId } = req.params;
  const category = req.query.category?.toLowerCase();

  try {
    let rows;
    if (category) {
      rows = await pool.query(
        `SELECT v.* FROM videos v
         JOIN categories c ON v.category_id = c.id
         WHERE v.match_id = ? AND LOWER(c.name) = ?`,
        [matchId, category]
      );
    } else {
      rows = await pool.query(
        "SELECT * FROM videos WHERE match_id = ?",
        [matchId]
      );
    }
    res.json(rows);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get single video by ID
app.get("/videos/:id", async (req, res) => {
  try {
    const rows = await pool.query("SELECT * FROM videos WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length > 0) return res.json(rows[0]);
    res.status(404).json({ error: "Video not found" });
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ---- Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
});


/*
import express from "express";
import pool from "./db.js";

const app = express();
app.use(express.json());

// ---- Routes ----

// List all categories
app.get("/categories", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query("SELECT id, name FROM categories");
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get videos (optionally filter by category name)
app.get("/videos", async (req, res) => {
  const category = req.query.category?.toLowerCase();
  try {
    const conn = await pool.getConnection();
    let rows;

    if (category) {
      rows = await conn.query(
        `SELECT v.* FROM videos v
         JOIN categories c ON v.category_id = c.id
         WHERE LOWER(c.name) = ?`,
        [category]
      );
    } else {
      rows = await conn.query("SELECT * FROM videos");
    }

    conn.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get videos for a specific match
app.get("/matches/:matchId/videos", async (req, res) => {
  const { matchId } = req.params;
  const category = req.query.category?.toLowerCase();

  try {
    const conn = await pool.getConnection();
    let rows;

    if (category) {
      rows = await conn.query(
        `SELECT v.* FROM videos v
         JOIN categories c ON v.category_id = c.id
         WHERE v.match_id = ? AND LOWER(c.name) = ?`,
        [matchId, category]
      );
    } else {
      rows = await conn.query("SELECT * FROM videos WHERE match_id = ?", [matchId]);
    }

    conn.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get single video
app.get("/videos/:id", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM videos WHERE id = ?", [req.params.id]);
    conn.release();

    if (rows.length > 0) return res.json(rows[0]);
    res.status(404).json({ error: "Video not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ---- Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
});



/*import express from "express";

const app = express();
app.use(express.json());

// ---- Mock Data ----
const categories = [
  { id: 1, name: "all goals" },
  { id: 2, name: "highlights" },
  { id: 3, name: "live stream" }
];

const videos = [
  {
    id: 101,
    match_id: 10,
    category_id: 2,
    title: "Matchday 3 Highlights",
    video_id: "yt_abc123",
    embed_code: "<iframe src='https://example.com/embed/yt_abc123'></iframe>"
  },
  {
    id: 102,
    match_id: 10,
    category_id: 1,
    title: "All Goals: Matchday 3",
    video_id: "yt_xyz789",
    embed_code: "<iframe src='https://example.com/embed/yt_xyz789'></iframe>"
  }
];

// ---- Routes ----

// List all categories
app.get("/categories", (req, res) => {
  res.json(categories);
});

// Get videos (optionally filter by category name)
app.get("/videos", (req, res) => {
  const category = req.query.category?.toLowerCase();
  if (category) {
    const cat = categories.find(c => c.name.toLowerCase() === category);
    if (!cat) return res.status(404).json({ error: "Category not found" });
    return res.json(videos.filter(v => v.category_id === cat.id));
  }
  res.json(videos);
});

// Get videos for a specific match (with optional category filter)
app.get("/matches/:matchId/videos", (req, res) => {
  const { matchId } = req.params;
  const category = req.query.category?.toLowerCase();
  let results = videos.filter(v => v.match_id == matchId);

  if (category) {
    const cat = categories.find(c => c.name.toLowerCase() === category);
    if (!cat) return res.status(404).json({ error: "Category not found" });
    results = results.filter(v => v.category_id === cat.id);
  }

  res.json(results);
});

// Get single video by ID
app.get("/videos/:id", (req, res) => {
  const video = videos.find(v => v.id == req.params.id);
  if (video) return res.json(video);
  res.status(404).json({ error: "Video not found" });
});

// ---- Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Mock API running on port ${PORT}`);
});
*/
