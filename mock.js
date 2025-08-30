import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

import categoriesRouter from "./src/routes/categories.js";
import videosRouter from "./src/routes/videos.js";
import interactionsRouter from "./src/routes/interactions.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, "./openapi.yaml"));

app.use(cors());
app.use(express.json());

// mount swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/categories", categoriesRouter);
app.use("/api/videos", videosRouter);
app.use("/api/interactions", interactionsRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Football Video API" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

/*import express from "express";
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
*/
