/**
 * TestCase.js — Mongoose schema for one input/expected-output pair of a problem.
 * Sample cases are shown to users; hidden ones are used to grade submissions.
 * Each test case references its parent Problem by id.
 */
import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true, index: true },
    input: { type: String, default: "" },
    output: { type: String, default: "" },
    // Sample cases are shown to the user; non-sample cases are hidden and used for grading.
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("TestCase", testCaseSchema);
