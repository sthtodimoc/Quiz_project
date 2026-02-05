import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, getUser, logout } from "../utils/auth";

function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    const loadDashboard = async () => {
      const token = getToken();
      if (!token) {
        logout();
        navigate("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/quiz/list", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load quizzes");

        const data = await res.json();

        const owned = data.filter((q) => {
          const ownerId =
            typeof q.owner === "object" ? q.owner._id : q.owner;
          return ownerId === user.id;
        });

        setQuizzes(owned);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, user?.id]);

  async function togglePublish(quizId) {
    try {
      const res = await fetch(
        `http://localhost:5000/quiz/${quizId}/publish`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      if (!res.ok) throw new Error("Publish failed");

      const data = await res.json();
      setQuizzes((prev) =>
        prev.map((q) => (q._id === quizId ? data.quiz : q))
      );
    } catch {
      alert("Failed to update publish status");
    }
  }

  async function deleteQuiz(quizId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quiz? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `http://localhost:5000/quiz/${quizId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
    } catch {
      alert("Failed to delete quiz");
    }
  }

  if (loading) return <div className="container">Loading dashboard...</div>;
  if (error)
    return (
      <div className="container" style={{ color: "red" }}>
        {error}
      </div>
    );

  return (
    <div className="login-page">
      <div className="dash-card">
        <div className="dash-header">
          <div>
            <h2 className="dash-title">Teacher Dashboard</h2>
            <p className="dash-subtitle">Manage your quizzes</p>
          </div>

          <div className="dash-actions">
            <button onClick={() => navigate("/notifications")}>
              Notifications
            </button>
            <button
              className="dash-ghost"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <p className="dash-empty">You haven't created any quizzes yet.</p>
        ) : (
          <div className="dash-grid">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="dash-item">
                <div className="dash-item-title">{quiz.title}</div>
                <div className="dash-item-meta">
                  {quiz.published ? "Published" : "Draft"}
                </div>

                <div className="dash-item-actions">
                  <Link to={`/quiz/${quiz._id}/add-question`}>
                    <button>Add Questions</button>
                  </Link>

                  <Link to={`/teacher/quiz/${quiz._id}/analytics`}>
                    <button>View Analytics</button>
                  </Link>

                  <button onClick={() => togglePublish(quiz._id)}>
                    {quiz.published ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteQuiz(quiz._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="dash-footer">
          <Link to="/quiz/create">
            <button className="login-primary">Create New Quiz</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
