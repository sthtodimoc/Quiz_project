import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import { getToken, logout } from "../utils/auth";

function QuizAnalytics() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selected, setSelected] = useState([]);
  const [stats, setStats] = useState(null);

  const [timeLimit, setTimeLimit] = useState(10);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      const token = getToken();
      if (!token) {
        logout();
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:5000/analytics/quiz/${quizId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          const msg = (await res.json()).message;
          throw new Error(msg || "Failed to load analytics");
        }

        const data = await res.json();

        setStats({
          totalAttempts: data.totalAttempts,
          averageScore: data.averageScore,
          highestScore: data.highestScore,
          lowestScore: data.lowestScore,
        });

        setAttempts(data.attempts || []);
        setLeaderboard(data.leaderboard || []);
        setTimeLimit(data.quiz?.timeLimit ?? 10);
        setMaxAttempts(data.quiz?.maxAttempts ?? 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [quizId, navigate]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  async function deleteAttempts(clearAll = false) {
    const confirmed = window.confirm(
      clearAll
        ? "Delete ALL attempts for this quiz?"
        : "Delete selected attempts?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `http://localhost:5000/teacher/quiz/${quizId}/attempts`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(
            clearAll ? {} : { attemptIds: selected }
          ),
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      setAttempts((prev) =>
        clearAll
          ? []
          : prev.filter((a) => !selected.includes(a._id))
      );
      setSelected([]);
    } catch (err) {
      alert(err.message);
    }
  }

  async function exportCSV() {
    try {
      const res = await fetch(
        `http://localhost:5000/teacher/quiz/${quizId}/export`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to export results");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-${quizId}-results.csv`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "Export failed");
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch(
        `http://localhost:5000/quiz/${quizId}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ timeLimit, maxAttempts }),
        }
      );

      if (!res.ok) throw new Error("Failed to save settings");
      alert("Quiz settings updated");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container">Loading analytics...</div>;
  if (error)
    return (
      <div className="container" style={{ color: "red" }}>
        {error}
      </div>
    );

  return (
    <div className="app-page">
      <div className="panel-card">
        <BackButton />
        <h2 className="page-title">Quiz Analytics</h2>
        <p className="page-subtitle">Performance and attempt insights</p>

        {stats && (
          <div className="glass-list">
            <div className="glass-item">Total Attempts: {stats.totalAttempts}</div>
            <div className="glass-item">Average Score: {stats.averageScore}</div>
            <div className="glass-item">Highest Score: {stats.highestScore}</div>
            <div className="glass-item">Lowest Score: {stats.lowestScore}</div>
          </div>
        )}

        <div className="action-row" style={{ marginTop: 12 }}>
          <button onClick={exportCSV}>Export Results (CSV)</button>
        </div>

        <div className="section">
          <h3 className="page-title" style={{ fontSize: 16 }}>
            Leaderboard
          </h3>

          {leaderboard.length === 0 ? (
            <p className="muted">No submissions yet.</p>
          ) : (
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr key={row.rank}>
                    <td>{row.rank}</td>
                    <td>{row.student}</td>
                    <td>{row.score}</td>
                    <td>{new Date(row.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="section">
          <h3 className="page-title" style={{ fontSize: 16 }}>
            Quiz Settings
          </h3>

          <div className="action-row">
            <label className="login-label" style={{ flex: "1 1 200px" }}>
              Time Limit (minutes)
              <input
                className="input-dark"
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
              />
            </label>

            <label className="login-label" style={{ flex: "1 1 200px" }}>
              Max Attempts
              <input
                className="input-dark"
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
              />
            </label>
          </div>

          <button onClick={saveSettings} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {attempts.length > 0 && (
          <div className="section">
            <div className="action-row">
              <button
                onClick={() => deleteAttempts(false)}
                disabled={!selected.length}
              >
                Delete Selected
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteAttempts(true)}
              >
                Clear All Attempts
              </button>
            </div>
          </div>
        )}

        <div className="section">
          <h3 className="page-title" style={{ fontSize: 16 }}>
            Student Attempts
          </h3>

          {attempts.length === 0 ? (
            <p className="muted">No attempts yet.</p>
          ) : (
            <div className="glass-list">
              {attempts.map((a) => (
                <div key={a._id} className="glass-item">
                  <label className="choice-row">
                    <strong>{a.student}</strong>
                    <input
                      type="checkbox"
                      checked={selected.includes(a._id)}
                      onChange={() => toggleSelect(a._id)}
                    />
                  </label>
                  <div className="muted">Score: {a.score}</div>
                  <div className="muted">
                    {new Date(a.submittedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuizAnalytics;
