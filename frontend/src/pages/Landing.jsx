// Landing.jsx — the public marketing page shown at "/" before login.
// Hero + features + "how it works" + call-to-action. It also fetches a live
// submission count from the public leaderboard endpoint to show in the hero stats.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";

const FEATURES = [
  {
    icon: "⚡",
    title: "Fast Judging",
    desc: "Submissions are compiled and graded in milliseconds with instant verdicts and timing.",
  },
  {
    icon: "🧩",
    title: "Multiple Languages",
    desc: "Write your solution in C++, Python, or Java — pick the right tool for the problem.",
  },
  {
    icon: "🛡️",
    title: "Secure Sandbox",
    desc: "Every run is isolated in a locked-down container: no network, capped CPU and memory.",
  },
  {
    icon: "🏆",
    title: "Live Leaderboard",
    desc: "Track recent submissions and verdicts across all users in real time.",
  },
];

const STEPS = [
  { icon: "📝", title: "Pick a Problem", desc: "Browse the problem set and choose a challenge to tackle." },
  { icon: "💻", title: "Write Your Code", desc: "Solve it in C++, Python, or Java right in the browser." },
  { icon: "⚡", title: "Get Instant Verdict", desc: "Your code runs in the sandbox and you see the result instantly." },
];

export default function Landing() {
  const [submissions, setSubmissions] = useState(null);

  // Live "Total Submissions" stat. The leaderboard endpoint is public, so we can
  // read it before login; limit=100 just caps how many rows we count.
  useEffect(() => {
    client
      .get("/leaderboard?limit=100")
      .then((res) => setSubmissions(res.data.length))
      .catch(() => setSubmissions(null));
  }, []);

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-inner">
          <span className="pill">⟨/⟩ The competitive coding arena</span>
          <h1 className="hero-title">
            Where code meets the <span className="gradient-text">arena.</span>
          </h1>
          <p className="hero-sub">
            Write it, run it, prove it — solve curated challenges in C++, Python &amp; Java,
            graded instantly in a secure sandbox.
            <span className="type-caret" aria-hidden="true" />
          </p>
          <div className="hero-cta">
            <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-lg">Register</Link>
          </div>
          <div className="hero-stats">
            <div><strong>12+</strong><span>Problems</span></div>
            <div><strong>3</strong><span>Languages</span></div>
            <div><strong>{submissions === null ? "—" : submissions}</strong><span>Total Submissions</span></div>
            <div><strong>&lt;1s</strong><span>Verdicts</span></div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Everything you need to practice</h2>
        <p className="section-sub">Built for speed, safety, and a great developer experience.</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how">
        <h2 className="section-title">How it works</h2>
        <p className="section-sub">From problem to verdict in three steps.</p>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className="step">
              <div className="step-num">{i + 1}</div>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < STEPS.length - 1 && <span className="step-arrow" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>Ready to enter the arena?</h2>
        <p>Create an account and submit your first solution in under a minute.</p>
        <Link to="/register" className="btn btn-primary btn-lg">Get started — it's free</Link>
      </section>

      <footer className="footer">
        <span className="brand"><span className="brand-mark">⟨/⟩</span> CodeArena</span>
        <div className="footer-right">
          <span className="docker-badge" title="Submissions run in an isolated Docker container">
            🐳 powered by Docker sandbox
          </span>
          <span className="muted">Built with the MERN stack</span>
        </div>
      </footer>
    </div>
  );
}
