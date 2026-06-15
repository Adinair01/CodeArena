/**
 * solutionController.js — handles code submissions and the leaderboard.
 * submit() saves the submission as Pending, runs it through the grader (codeExecutor),
 * then stores the verdict. leaderboard() returns the most recent submissions + results.
 */
import asyncHandler from "express-async-handler";
import Problem from "../models/Problem.js";
import TestCase from "../models/TestCase.js";
import Solution from "../models/Solution.js";
import { grade, SUPPORTED_LANGUAGES } from "../services/codeExecutor.js";

// POST /api/submissions  (protected)
// body: { problemId, language, source }
export const submit = asyncHandler(async (req, res) => {
  const { problemId, language, source } = req.body;
  if (!problemId || !language || !source) {
    res.status(400);
    throw new Error("problemId, language and source are required");
  }
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    res.status(400);
    throw new Error(`Unsupported language. Use one of: ${SUPPORTED_LANGUAGES.join(", ")}`);
  }

  const problem = await Problem.findById(problemId);
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  const testCases = await TestCase.find({ problem: problem._id }).select("input output");
  if (!testCases.length) {
    res.status(400);
    throw new Error("This problem has no test cases yet");
  }

  // Persist the submission first as Pending so it always exists.
  const solution = await Solution.create({
    problem: problem._id,
    user: req.user._id,
    language,
    source,
    verdict: "Pending",
    totalCount: testCases.length,
  });

  const result = await grade({
    language,
    source,
    testCases,
    timeLimitMs: problem.timeLimitMs,
  });

  solution.verdict = result.verdict;
  solution.passedCount = result.passedCount;
  solution.totalCount = result.totalCount;
  solution.timeMs = result.timeMs;
  solution.message = result.message;
  await solution.save();

  res.status(201).json(solution);
});

// GET /api/submissions/me  (protected)
export const mySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Solution.find({ user: req.user._id })
    .populate("problem", "name code")
    .sort({ submitted_at: -1 })
    .limit(50);
  res.json(submissions);
});

// GET /api/leaderboard  (public) — most recent submissions with verdicts
export const leaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const submissions = await Solution.find()
    .populate("problem", "name code")
    .populate("user", "username")
    .sort({ submitted_at: -1 })
    .limit(limit)
    .select("verdict language passedCount totalCount timeMs submitted_at problem user");
  res.json(submissions);
});
