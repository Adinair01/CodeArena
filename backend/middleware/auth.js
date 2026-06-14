/**
 * auth.js — Express middleware that protects routes.
 * protect() reads the "Bearer <token>" header, verifies the JWT, and loads the user
 * onto req.user. admin() further restricts a route to admin accounts only.
 */
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { verifyToken } from "../utils/token.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    res.status(401);
    throw new Error("Not authorized, token invalid");
  }
  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error("Not authorized, user not found");
  }
  req.user = user;
  next();
});

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403);
  throw new Error("Admin access required");
};
