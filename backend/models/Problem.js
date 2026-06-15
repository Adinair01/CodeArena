/**
 * Problem.js — Mongoose schema for a coding problem.
 * Holds the statement, a short unique slug (code), difficulty, and time limit.
 * The actual test cases live in a separate collection (see TestCase.js).
 */
import mongoose from "mongoose";

const problemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true }, // short slug, e.g. "TWOSUM"
    statement: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },
    timeLimitMs: { type: Number, default: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Problem", problemSchema);
