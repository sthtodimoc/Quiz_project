import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken, logout } from "../utils/auth";
import BackButton from "../components/BackButton";

function ReviewAttempt() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttempt = async () => {
      const token = getToken();
      if (!token) {
        logout();
        navigate("/login");
        return;
      }

      const res = await fetch(
        `http://localhost:5000/attempt/${attemptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        navigate("/history");
        return;
      }

      const data = await res.json();
      setAttempt(data);
      setLoading(false);
    };

    loadAttempt();
  }, [attemptId, navigate]);

  if (loading) return <div className="container">Loading...</div>;
  if (!attempt) return null;

  const questions =
    attempt.questionsSnapshot ||
    attempt.quizId?.questions ||
    [];

  return (
    <div className="app-page">
      <div className="panel-card">
        <BackButton />

        <h2 className="page-title">
          {attempt.quizId?.title || "Deleted Quiz"} - Review
        </h2>
        <p className="page-subtitle">Compare your answers</p>

        {questions.length === 0 && (
          <p className="muted">No questions available for this attempt.</p>
        )}

        <div className="glass-list">
          {questions.map((q, index) => {
            const studentAnswer = attempt.answers?.[String(index)];
            const correctAnswer = q.correct;
            const isCorrect = studentAnswer === correctAnswer;

            return (
              <div key={index} className="glass-item">
                <div className="dash-item-title">
                  Q{index + 1}: {q.text}
                </div>

                <div className="muted">
                  Your answer:{" "}
                  {studentAnswer !== undefined
                    ? q.options[studentAnswer]
                    : "No answer"}
                </div>

                <div className="muted">
                  Correct answer: {q.options[correctAnswer]}
                </div>

                <div
                  className="muted"
                  style={{ color: isCorrect ? "#8fe3b1" : "#ff8d8d" }}
                >
                  {isCorrect ? "Correct" : "Incorrect"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ReviewAttempt;
