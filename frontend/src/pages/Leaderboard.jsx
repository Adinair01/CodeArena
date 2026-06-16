// Leaderboard.jsx — shows the most recent submissions across all users (protected page).
// Fetches /api/leaderboard and renders each verdict with a matching emoji for quick scanning.
import { useEffect, useState } from "react";
import client from "../api/client.js";

const fmt = (d) => new Date(d).toLocaleString();

// Emoji shown next to each verdict so the result is readable at a glance.
const VERDICT_ICON = {
  Accepted: "✅",
  "Wrong Answer": "❌",
  "Time Limit Exceeded": "⏱️",
  "Runtime Error": "💥",
  "Compilation Error": "⚠️",
  Pending: "⏳",
  "Internal Error": "❗",
};

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/leaderboard")
      .then((res) => setRows(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Recent Submissions</h1>
      {rows.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Problem</th>
              <th>Lang</th>
              <th>Verdict</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s._id}>
                <td className="muted">{fmt(s.submitted_at)}</td>
                <td>@{s.user?.username || "?"}</td>
                <td><code>{s.problem?.code}</code> {s.problem?.name}</td>
                <td>{s.language}</td>
                <td>
                  <span className={`verdict-tag ${s.verdict === "Accepted" ? "ok" : "bad"}`}>
                    {VERDICT_ICON[s.verdict] || "•"} {s.verdict}
                  </span>
                </td>
                <td>{s.passedCount}/{s.totalCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
