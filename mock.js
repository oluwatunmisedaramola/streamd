import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";
import globalErrorHandler from "./utils/GlobalErrorHandler.js";

import categoriesRouter from "./src/routes/categories.js";
import videosRouter from "./src/routes/videos.js";
import interactionsRouter from "./src/routes/interactions.js";
import authRouter from "./src/routes/auth.js";

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
app.use("/api/auth",authRouter );

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Football Video API" });
});

// Global error handler (should be last middleware)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
