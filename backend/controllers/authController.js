/**
 * authController.js — handles register, login, and "who am I" (me).
 * On register/login we issue a JWT: a signed token the client stores and sends back
 * on later requests to prove who it is. Passwords are verified with bcrypt.
 */
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";

const publicUser = (u) => ({ id: u._id, username: u.username, email: u.email, role: u.role });

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("username, email and password are required");
  }
  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) {
    res.status(409);
    throw new Error("User with that email or username already exists");
  }
  const user = await User.create({ username, email, password });
  res.status(201).json({ user: publicUser(user), token: signToken(user._id) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("email and password are required");
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }
  res.json({ user: publicUser(user), token: signToken(user._id) });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
