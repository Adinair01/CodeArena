// client.js — a shared axios instance for talking to the backend API.
// An interceptor automatically attaches the JWT (from localStorage) to every request,
// so we don't have to add the auth header manually each time.
import axios from "axios";

const client = axios.create({ baseURL: "/api" });

// Attach JWT from localStorage on every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("oj_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
