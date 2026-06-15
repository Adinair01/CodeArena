/**
 * problemController.js — logic for listing problems, viewing one, and creating one.
 * getProblem accepts either a Mongo id or the short code slug, and returns only the
 * sample test cases (hidden ones stay secret). createProblem requires a logged-in user.
 */
import asyncHandler from "express-async-handler";
import Problem from "../models/Problem.js";
import TestCase from "../models/TestCase.js";

// GET /api/problems
export const listProblems = asyncHandler(async (req, res) => {
  const problems = await Problem.find()
    .select("name code difficulty createdAt")
    .sort({ createdAt: -1 });
  res.json(problems);
});

// GET /api/problems/:id  (accepts Mongo _id or the short code slug)
export const getProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { code: id.toUpperCase() };
  const problem = await Problem.findOne(query);
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }
  const samples = await TestCase.find({ problem: problem._id, isSample: true }).select("input output");
  res.json({ ...problem.toObject(), samples });
});

// POST /api/problems  (protected)
// body: { name, code, statement, difficulty, timeLimitMs, testCases: [{input, output, isSample}] }
export const createProblem = asyncHandler(async (req, res) => {
  const { name, code, statement, difficulty, timeLimitMs, testCases = [] } = req.body;
  if (!name || !code || !statement) {
    res.status(400);
    throw new Error("name, code and statement are required");
  }
  const problem = await Problem.create({
    name,
    code: code.toUpperCase(),
    statement,
    difficulty,
    timeLimitMs,
    createdBy: req.user._id,
  });

  if (Array.isArray(testCases) && testCases.length) {
    await TestCase.insertMany(
      testCases.map((tc) => ({
        problem: problem._id,
        input: tc.input ?? "",
        output: tc.output ?? "",
        isSample: Boolean(tc.isSample),
      }))
    );
  }
  res.status(201).json(problem);
});
