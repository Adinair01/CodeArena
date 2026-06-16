// ProblemList.jsx — the table of all problems (a protected page).
// Fetches /api/problems and links each row to its detail/solve page.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/problems")
      .then((res) => setProblems(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load problems"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Problems</h1>
      {problems.length === 0 ? (
        <p>No problems yet. Run <code>npm run seed</code> in the backend to add samples.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr key={p._id}>
                <td><code>{p.code}</code></td>
                <td><Link to={`/problems/${p._id}`}>{p.name}</Link></td>
                <td><span className={`badge ${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
