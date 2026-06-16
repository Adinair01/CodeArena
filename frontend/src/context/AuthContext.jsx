// AuthContext.jsx — global login state for the whole app.
// Stores the JWT in localStorage and exposes login/register/logout helpers.
// On load it calls /auth/me to restore the session from a saved token.
import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("oj_token");
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("oj_token"))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = ({ user, token }) => {
    localStorage.setItem("oj_token", token);
    setUser(user);
  };

  const login = async (email, password) => {
    const res = await client.post("/auth/login", { email, password });
    handleAuth(res.data);
  };

  const register = async (username, email, password) => {
    const res = await client.post("/auth/register", { username, email, password });
    handleAuth(res.data);
  };

  const logout = () => {
    localStorage.removeItem("oj_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
