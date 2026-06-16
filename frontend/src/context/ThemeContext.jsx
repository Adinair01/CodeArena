// ThemeContext.jsx — global dark/light theme state.
// Toggles a "light"/"dark" class on <body> and remembers the choice in localStorage.
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem("oj_theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return "dark";
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Keep <body> class and localStorage in sync with state.
  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    try {
      localStorage.setItem("oj_theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
