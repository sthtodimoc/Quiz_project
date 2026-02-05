import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  isAdmin,
  isStaff,
  getToken,
  logout,
  getUser,
} from "../utils/auth";

function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [attemptInfo, setAttemptInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleRequest, setRoleRequest] = useState(null);
  const [requestedRole, setRequestedRole] = useState("teacher");
  const [requestLoading, setRequestLoading] = useState(false);

  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    let cancelled = false;

    const loadQuizzes = async () => {
      const token = getToken();
      if (!token) {
        logout();
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch("http://localhost:5000/quiz/list", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error("Failed to load quizzes");

        const quizArray = await res.json();
        if (cancelled) return;

        setQuizzes(quizArray);

        if (user?.role === "student") {
          const info = {};

          await Promise.all(
            quizArray.map(async (quiz) => {
              try {
                const r = await fetch(
                  `http://localhost:5000/attempt/count/${quiz._id}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                info[quiz._id] = r.ok
                  ? await r.json()
                  : { count: 0, maxAttempts: quiz.maxAttempts };
              } catch {
                info[quiz._id] = {
                  count: 0,
                  maxAttempts: quiz.maxAttempts,
                };
              }
            })
          );

          if (!cancelled) setAttemptInfo(info);
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadQuizzes();
    return () => (cancelled = true);
  }, [navigate, user?.role]);

  useEffect(() => {
    let cancelled = false;

    const loadRoleRequest = async () => {
      if (user?.role !== "student") return;

      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch(
          "http://localhost:5000/users/me/role-request",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        if (!cancelled) setRoleRequest(data.roleRequest);
      } catch {
        if (!cancelled) setRoleRequest(null);
      }
    };

    loadRoleRequest();
    return () => (cancelled = true);
  }, [user?.role]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function togglePublish(quizId) {
    const res = await fetch(
      `http://localhost:5000/quiz/${quizId}/publish`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );

    if (!res.ok) return alert("Failed to update publish status");

    const data = await res.json();
    setQuizzes((prev) =>
      prev.map((q) => (q._id === quizId ? data.quiz : q))
    );
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
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Delete failed");
      }

      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
    } catch (err) {
      alert("Failed to delete quiz");
      console.error(err);
    }
  }

  async function submitRoleRequest() {
    if (requestLoading) return;

    const confirmed = window.confirm(
      `Send request to become ${requestedRole}?`
    );
    if (!confirmed) return;

    setRequestLoading(true);
    try {
      const res = await fetch(
        "http://localhost:5000/users/me/role-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ requestedRole }),
        }
      );

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || "Request failed");
      }

      const data = await res.json();
      setRoleRequest(data.roleRequest);
    } catch (err) {
      alert(err.message);
    } finally {
      setRequestLoading(false);
    }
  }

  if (loading) return <div className="container">Loading quizzes...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div className="app-page">
      <div className="panel-card">
        <div className="dash-header">
          <div>
            <h2 className="page-title">Available Quizzes</h2>
            <p className="page-subtitle">Browse and take quizzes</p>
          </div>
          <div className="dash-actions">
            {isAdmin() && (
              <button onClick={() => navigate("/admin/dashboard")}>
                Admin Dashboard
              </button>
            )}
            <button className="dash-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="glass-list">
          {quizzes.map((quiz) => {
            const attempt = attemptInfo[quiz._id];
            const exhausted =
              user?.role === "student" &&
              attempt &&
              attempt.count >= attempt.maxAttempts;

            return (
              <div key={quiz._id} className="glass-item">
                <div className="dash-item-title">{quiz.title}</div>
                {user?.role === "student" && attempt && (
                  <div className="muted">
                    Attempts: {attempt.count}/{attempt.maxAttempts}
                  </div>
                )}

                <div className="action-row">
                  {exhausted ? (
                    <button disabled>Attempts Used</button>
                  ) : (
                    <Link to={`/quiz/${quiz._id}`}>
                      <button>
                        {user?.role === "student" ? "Take Quiz" : "View Quiz"}
                      </button>
                    </Link>
                  )}

                  {isStaff() && (
                    <>
                      <Link to={`/quiz/${quiz._id}/add-question`}>
                        <button>Add Question</button>
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
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="section">
          {isAdmin() && (
            <Link to="/quiz/create">
              <button className="login-primary">Add New Quiz</button>
            </Link>
          )}
        </div>

        {user?.role === "student" && (
          <div className="section">
            <div className="action-row">
              <Link to="/history">
                <button>View My Results</button>
              </Link>

              <button onClick={() => navigate("/notifications")}>
                Notifications
              </button>
            </div>
          </div>
        )}

        {user?.role === "student" && (
          <div className="section">
            <h3 className="page-title" style={{ fontSize: 16 }}>
              Request Role Change
            </h3>

            {roleRequest?.status === "pending" && (
              <p className="muted">
                Your request to become {roleRequest.requestedRole} is pending.
              </p>
            )}

            {roleRequest?.status === "denied" && (
              <p className="muted">
                Your request to become {roleRequest.requestedRole} was denied.
                You can submit a new request below.
              </p>
            )}

            {roleRequest?.status === "approved" && user?.role !== "student" && (
              <p className="muted">
                Your request was approved. Please log out and log back in to
                refresh your access.
              </p>
            )}

            {(!roleRequest ||
              !roleRequest.status ||
              roleRequest.status === "denied" ||
              user?.role === "student") && (
              <div className="action-row">
                <select
                  className="input-dark"
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  style={{ maxWidth: 220 }}
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  onClick={submitRoleRequest}
                  disabled={requestLoading}
                >
                  {requestLoading ? "Sending..." : "Request Role"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizList;
