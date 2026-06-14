/**
 * db.js — connects the app to MongoDB using Mongoose.
 * Mongoose is an ODM: it lets us work with MongoDB through JS schemas/objects
 * instead of raw queries. connectDB() is called once on startup from server.js.
 */
import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set");
  }
  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};
