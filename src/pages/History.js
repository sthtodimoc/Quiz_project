import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import { getToken, isLoggedIn, logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";

function History() {
  const [attempts, setAttempts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();

    if (!isLoggedIn() || !token) {
      navigate("/login");
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/attempt/my-attempts",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load attempts");
        }

        const data = await res.json();
        setAttempts(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Could not load attempt history.");
        setLoading(false);
      }
    };

    loadHistory();
  }, [navigate]);

  function toggle(id) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  async function deleteSelected() {
    if (selected.length === 0) {
      return alert("No attempts selected");
    }

    await fetch("http://localhost:5000/attempt", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ ids: selected }),
    });

    setAttempts((prev) =>
      prev.filter((a) => !selected.includes(a._id))
    );
    setSelected([]);
  }

  async function clearAll() {
    if (!window.confirm("Clear all attempt history?")) return;

    await fetch("http://localhost:5000/attempt/clear/all", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    setAttempts([]);
    setSelected([]);
  }

  if (loading) return <div className="container">Loading history...</div>;
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
        <h2 className="page-title">Your Quiz Attempts</h2>
        <p className="page-subtitle">Review your submissions</p>

        {attempts.length > 0 && (
          <div className="action-row">
            <button onClick={deleteSelected}>Delete Selected</button>
            <button className="delete-btn" onClick={clearAll}>
              Clear All
            </button>
          </div>
        )}

        {attempts.length === 0 && (
          <p className="muted">No attempts yet.</p>
        )}

        <div className="glass-list">
          {attempts.map((attempt) => (
            <div key={attempt._id} className="glass-item">
              <label className="choice-row">
                <strong>
                  {attempt.quizId?.title || "Unknown quiz"}
                </strong>
                <input
                  type="checkbox"
                  checked={selected.includes(attempt._id)}
                  onChange={() => toggle(attempt._id)}
                />
              </label>
              <div className="muted">Score: {attempt.score}</div>
              <div className="muted">
                Submitted:{" "}
                {attempt.submittedAt
                  ? new Date(attempt.submittedAt).toLocaleString()
                  : "Not submitted"}
              </div>
              <div className="action-row" style={{ marginTop: 8 }}>
                <button
                  onClick={() =>
                    navigate(`/attempt/${attempt._id}/review`)
                  }
                >
                  Review Answers
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default History;
