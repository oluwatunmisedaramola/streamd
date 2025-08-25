import express from "express";

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
