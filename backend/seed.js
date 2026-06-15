/**
 * seed.js — fills the database with an admin user and a set of sample problems.
 * Run with `npm run seed`. It wipes existing data first, then inserts every problem
 * along with its test cases. Handy for demos and fresh local setups.
 */
import "dotenv/config";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import User from "./models/User.js";
import Problem from "./models/Problem.js";
import TestCase from "./models/TestCase.js";
import Solution from "./models/Solution.js";

/**
 * Seeds an admin user and a set of problems with test cases.
 * Run with:  npm run seed
 *
 * Every problem defines its exact input/output contract in the statement so
 * solutions are deterministic. All listed test cases are hidden (graded).
 */

const problems = [
  // ----------------------------- ORIGINAL --------------------------------
  {
    name: "A + B",
    code: "APLUSB",
    difficulty: "Easy",
    timeLimitMs: 2000,
    statement:
      "Read two integers a and b from standard input (space-separated) and print their sum.",
    tests: [
      { input: "2 3\n", output: "5\n", isSample: true },
      { input: "100 250\n", output: "350\n" },
      { input: "-5 5\n", output: "0\n" },
    ],
  },
  {
    name: "Reverse a String",
    code: "REVSTR",
    difficulty: "Easy",
    timeLimitMs: 2000,
    statement: "Read a single line string and print it reversed.",
    tests: [
      { input: "hello\n", output: "olleh\n", isSample: true },
      { input: "abcd\n", output: "dcba\n" },
      { input: "racecar\n", output: "racecar\n" },
    ],
  },

  // ------------------------------- EASY ----------------------------------
  {
    name: "Two Sum",
    code: "TWOSUM",
    difficulty: "Easy",
    timeLimitMs: 2000,
    statement:
      "The first line contains two integers n and target. The second line contains n " +
      "integers. Exactly one pair of distinct positions sums to target. Print their " +
      "1-based indices i and j (with i < j), space-separated.",
    tests: [
      { input: "4 9\n2 7 11 15\n", output: "1 2\n", isSample: true },
      { input: "3 6\n3 2 4\n", output: "2 3\n" },
      { input: "2 6\n3 3\n", output: "1 2\n" },
      { input: "5 10\n1 2 3 4 6\n", output: "4 5\n" },
    ],
  },
  {
    name: "Palindrome Check",
    code: "PALIN",
    difficulty: "Easy",
    timeLimitMs: 2000,
    statement:
      "Read a single line string (lowercase letters, no spaces). Print \"YES\" if it is " +
      "a palindrome, otherwise print \"NO\".",
    tests: [
      { input: "racecar\n", output: "YES\n", isSample: true },
      { input: "hello\n", output: "NO\n" },
      { input: "a\n", output: "YES\n" },
      { input: "abba\n", output: "YES\n" },
    ],
  },
  {
    name: "Factorial",
    code: "FACT",
    difficulty: "Easy",
    timeLimitMs: 2000,
    statement:
      "Read a single integer n (0 <= n <= 20) and print n! (n factorial). The answer " +
      "fits in a 64-bit unsigned integer.",
    tests: [
      { input: "5\n", output: "120\n", isSample: true },
      { input: "0\n", output: "1\n" },
      { input: "10\n", output: "3628800\n" },
      { input: "20\n", output: "2432902008176640000\n" },
    ],
  },
  {
    name: "Count Vowels",
    code: "VOWELS",
    difficulty: "Easy",
    timeLimitMs: 2000,
    statement:
      "Read a single line of text and print the number of vowels (a, e, i, o, u, " +
      "case-insensitive) it contains.",
    tests: [
      { input: "hello world\n", output: "3\n", isSample: true },
      { input: "AEIOU\n", output: "5\n" },
      { input: "xyz\n", output: "0\n" },
      { input: "Programming\n", output: "3\n" },
    ],
  },

  // ------------------------------ MEDIUM ---------------------------------
  {
    name: "Binary Search",
    code: "BINSRCH",
    difficulty: "Medium",
    timeLimitMs: 2000,
    statement:
      "The first line contains two integers n and target. The second line contains n " +
      "distinct integers in strictly increasing order. Print the 0-based index of " +
      "target, or -1 if it is not present.",
    tests: [
      { input: "5 7\n1 3 5 7 9\n", output: "3\n", isSample: true },
      { input: "5 4\n1 3 5 7 9\n", output: "-1\n" },
      { input: "1 1\n1\n", output: "0\n" },
      { input: "6 13\n2 4 6 8 10 13\n", output: "5\n" },
    ],
  },
  {
    name: "Valid Parentheses",
    code: "VALIDPAR",
    difficulty: "Medium",
    timeLimitMs: 2000,
    statement:
      "Read a single line containing only the characters ()[]{}. Print \"YES\" if the " +
      "brackets are balanced and correctly nested, otherwise print \"NO\".",
    tests: [
      { input: "()\n", output: "YES\n", isSample: true },
      { input: "()[]{}\n", output: "YES\n" },
      { input: "(]\n", output: "NO\n" },
      { input: "([)]\n", output: "NO\n" },
      { input: "{[]}\n", output: "YES\n" },
    ],
  },
  {
    name: "Longest Common Prefix",
    code: "LCP",
    difficulty: "Medium",
    timeLimitMs: 2000,
    statement:
      "The first line contains an integer n. The next n lines each contain a string of " +
      "lowercase letters. Print the longest common prefix of all n strings. If there is " +
      "no common prefix, print an empty line.",
    tests: [
      { input: "3\nflower\nflow\nflight\n", output: "fl\n", isSample: true },
      { input: "3\ndog\nracecar\ncar\n", output: "\n" },
      { input: "2\ninterspecies\ninterstellar\n", output: "inters\n" },
      { input: "1\nsingle\n", output: "single\n" },
    ],
  },
  {
    name: "FizzBuzz Sequence",
    code: "FIZZBUZZ",
    difficulty: "Medium",
    timeLimitMs: 2000,
    statement:
      "Read an integer n. For each integer i from 1 to n, print on its own line: " +
      "\"FizzBuzz\" if i is divisible by both 3 and 5, \"Fizz\" if divisible by 3, " +
      "\"Buzz\" if divisible by 5, otherwise i itself.",
    tests: [
      { input: "5\n", output: "1\n2\nFizz\n4\nBuzz\n", isSample: true },
      {
        input: "15\n",
        output:
          "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n",
      },
      { input: "3\n", output: "1\n2\nFizz\n" },
      { input: "1\n", output: "1\n" },
    ],
  },

  // ------------------------------- HARD ----------------------------------
  {
    name: "N-Queens Count",
    code: "NQUEENS",
    difficulty: "Hard",
    timeLimitMs: 3000,
    statement:
      "Read an integer n (1 <= n <= 12). Print the number of distinct solutions to the " +
      "n-queens puzzle: ways to place n queens on an n x n board so none attack another.",
    tests: [
      { input: "1\n", output: "1\n", isSample: true },
      { input: "4\n", output: "2\n" },
      { input: "6\n", output: "4\n" },
      { input: "8\n", output: "92\n" },
    ],
  },
  {
    name: "Longest Increasing Subsequence",
    code: "LIS",
    difficulty: "Hard",
    timeLimitMs: 3000,
    statement:
      "The first line contains an integer n. The second line contains n integers. Print " +
      "the length of the longest strictly increasing subsequence.",
    tests: [
      { input: "8\n10 9 2 5 3 7 101 18\n", output: "4\n", isSample: true },
      { input: "1\n5\n", output: "1\n" },
      { input: "5\n1 2 3 4 5\n", output: "5\n" },
      { input: "5\n5 4 3 2 1\n", output: "1\n" },
      { input: "6\n0 1 0 3 2 3\n", output: "4\n" },
    ],
  },
];

const run = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Problem.deleteMany({}),
    TestCase.deleteMany({}),
    Solution.deleteMany({}),
  ]);

  const admin = await User.create({
    username: "admin",
    email: "admin@oj.local",
    password: "admin123",
    role: "admin",
  });
  console.log("Created admin user  -> admin@oj.local / admin123");

  for (const p of problems) {
    const problem = await Problem.create({
      name: p.name,
      code: p.code,
      statement: p.statement,
      difficulty: p.difficulty,
      timeLimitMs: p.timeLimitMs,
      createdBy: admin._id,
    });
    await TestCase.insertMany(
      p.tests.map((t) => ({
        problem: problem._id,
        input: t.input ?? "",
        output: t.output ?? "",
        isSample: Boolean(t.isSample),
      }))
    );
    console.log(`  + ${p.code.padEnd(9)} ${p.name} (${p.tests.length} tests)`);
  }

  console.log(`\nSeeded ${problems.length} problems.`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
