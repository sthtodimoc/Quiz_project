import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import { getToken, logout } from "../utils/auth";

function AdminAnalytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

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
          "http://localhost:5000/analytics/overview",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const msg = (await res.json()).message;
          throw new Error(msg || "Failed to load analytics");
        }

        const result = await res.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [navigate]);

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
        <h2 className="page-title">System Analytics</h2>
        <p className="page-subtitle">Overview of quiz performance</p>

        {data.length === 0 ? (
          <p className="muted">No quiz data available.</p>
        ) : (
          <table className="table-glass">
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th>Total Attempts</th>
                <th>Average Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((q) => (
                <tr key={q.quizId}>
                  <td>{q.title}</td>
                  <td>{q.totalAttempts}</td>
                  <td>{q.averageScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminAnalytics;
