// ProblemDetail.jsx — one problem plus the code editor (a protected page).
// Lets the user pick a language, write code, submit it, and see the verdict returned
// by the backend grader.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client.js";

const LANGUAGES = [
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
];

const STARTERS = {
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    // your code\n    return 0;\n}\n`,
  python: `import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # your code\n\nmain()\n`,
  java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your code\n    }\n}\n`,
};

export default function ProblemDetail() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [source, setSource] = useState(STARTERS.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    client
      .get(`/problems/${id}`)
      .then((res) => setProblem(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load problem"));
  }, [id]);

  const onLanguageChange = (lang) => {
    setLanguage(lang);
    // Only overwrite if the editor still holds an untouched starter.
    if (Object.values(STARTERS).includes(source)) setSource(STARTERS[lang]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError("");
    try {
      const res = await client.post("/submissions", { problemId: problem._id, language, source });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !problem) return <p className="error">{error}</p>;
  if (!problem) return <p>Loading…</p>;

  return (
    <div className="problem">
      <h1>{problem.name} <span className={`badge ${problem.difficulty?.toLowerCase()}`}>{problem.difficulty}</span></h1>
      <p className="muted">Time limit: {problem.timeLimitMs} ms</p>
      <pre className="statement">{problem.statement}</pre>

      {problem.samples?.length > 0 && (
        <div className="samples">
          <h3>Sample test cases</h3>
          {problem.samples.map((s, i) => (
            <div key={i} className="sample">
              <div><strong>Input</strong><pre>{s.input}</pre></div>
              <div><strong>Output</strong><pre>{s.output}</pre></div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="submit-form">
        <h3>Submit</h3>
        <select value={language} onChange={(e) => onLanguageChange(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={16}
          spellCheck={false}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Judging…" : "Submit"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {result && (
        <div className={`verdict ${result.verdict === "Accepted" ? "ok" : "bad"}`}>
          <strong>{result.verdict}</strong> — passed {result.passedCount}/{result.totalCount}
          {result.timeMs ? ` · ${result.timeMs} ms` : ""}
          {result.message && <pre>{result.message}</pre>}
        </div>
      )}
    </div>
  );
}
