/**
 * Solution.js — Mongoose schema for a single code submission.
 * Stores the source, language, and grading result (verdict, passed count, time).
 * VERDICTS lists every possible outcome (Accepted, Wrong Answer, TLE, etc.).
 */
import mongoose from "mongoose";

export const VERDICTS = [
  "Pending",
  "Accepted",
  "Wrong Answer",
  "Compilation Error",
  "Runtime Error",
  "Time Limit Exceeded",
  "Internal Error",
];

const solutionSchema = new mongoose.Schema(
  {
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    language: { type: String, enum: ["cpp", "python", "java"], required: true },
    source: { type: String, required: true },
    verdict: { type: String, enum: VERDICTS, default: "Pending" },
    // Per-test detail for debugging / display.
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    timeMs: { type: Number, default: 0 },
    message: { type: String, default: "" },
    submitted_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Solution", solutionSchema);
