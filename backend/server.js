/**
 * server.js — the Express app entry point (the backend's front door).
 * Sets up middleware + CORS, mounts all /api routes, connects to MongoDB, then listens.
 * Every request from the React app hits here first before reaching a controller.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import solutionRoutes from "./routes/solutionRoutes.js";
import { leaderboard } from "./controllers/solutionController.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", solutionRoutes);
app.get("/api/leaderboard", leaderboard);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });

export default app;
