// App.jsx — the top-level component: the navbar plus all the routes.
// RequireAuth guards the app pages, so logged-out users get bounced to the landing page.
// The navbar also holds the theme toggle (sun/moon) and adapts to login state.
import { Routes, Route, Link, Navigate, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import Landing from "./pages/Landing.jsx";
import ProblemList from "./pages/ProblemList.jsx";
import ProblemDetail from "./pages/ProblemDetail.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = () => {
    logout();
    navigate("/");
  };
  return (
    <nav className="nav">
      <Link to={user ? "/problems" : "/"} className="brand">
        <span className="brand-mark">⟨/⟩</span> CodeArena
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <NavLink to="/problems" className="nav-link">Problems</NavLink>
            <NavLink to="/leaderboard" className="nav-link">Leaderboard</NavLink>
            <span className="nav-user">@{user.username}</span>
            <ThemeToggle />
            <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <ThemeToggle />
            <Link to="/login" className="btn btn-ghost">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

// Protect routes: unauthenticated users are bounced to the landing page.
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container center-state">Loading…</div>;
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/problems"
          element={
            <RequireAuth>
              <main className="container"><ProblemList /></main>
            </RequireAuth>
          }
        />
        <Route
          path="/problems/:id"
          element={
            <RequireAuth>
              <main className="container"><ProblemDetail /></main>
            </RequireAuth>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <RequireAuth>
              <main className="container"><Leaderboard /></main>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
