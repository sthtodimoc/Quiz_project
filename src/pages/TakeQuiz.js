import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import BackButton from "../components/BackButton";
import { getToken, getUser } from "../utils/auth";

function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const quizRes = await fetch(
          `http://localhost:5000/quiz/${quizId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const quizData = await quizRes.json();
        if (!quizRes.ok) {
          throw new Error(quizData.message || "Failed to load quiz");
        }

        setQuiz(quizData);

        if (user?.role === "student") {
          setTimeLeft(quizData.timeLimit * 60);

          const startRes = await fetch(
            `http://localhost:5000/attempt/start/${quizId}`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const startData = await startRes.json();
          if (!startRes.ok) {
            throw new Error(startData.message || "Cannot start attempt");
          }

          setAttemptId(startData.attempt._id);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    load();
  }, [quizId, navigate, user?.role]);

  useEffect(() => {
    if (
      user?.role !== "student" ||
      submitted ||
      timeLeft === null
    )
      return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted, user?.role]);

  async function submitQuiz(auto = false) {
    if (!quiz || !attemptId || submitted) return;

    let correctCount = 0;
    quiz.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct) correctCount++;
    });

    setScore(correctCount);
    clearInterval(timerRef.current);
    setSubmitError("");

    try {
      const res = await fetch(
        `http://localhost:5000/attempt/submit/${attemptId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ answers: selectedAnswers }),
        }
      );
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || "Submit failed");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err.message || "Submit failed. Please try again."
      );
    }
  }

  if (loading) return <div className="container">Loading quiz...</div>;
  if (error)
    return (
      <div className="container" style={{ color: "red" }}>
        {error}
      </div>
    );
  if (!quiz) return <div className="container">Quiz not found.</div>;

  return (
    <div className="app-page">
      <div className="panel-card">
        <BackButton />
        <h2 className="page-title">{quiz.title}</h2>
        <p className="page-subtitle">Answer all questions</p>

        {user?.role === "student" && !submitted && (
          <p className="muted">
            Time left: {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </p>
        )}

        {!submitted &&
          quiz.questions.map((q, index) => (
            <div key={index} className="glass-item" style={{ marginBottom: 12 }}>
              <p>
                <strong>Q{index + 1}:</strong> {q.text}
              </p>

              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className="choice-row"
                  style={{ marginBottom: 6 }}
                >
                  <span>{opt}</span>
                  <input
                    type="radio"
                    name={`q-${index}`}
                    checked={selectedAnswers[index] === i}
                    onChange={() =>
                      setSelectedAnswers((prev) => ({
                        ...prev,
                        [index]: i,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          ))}

        {!submitted && user?.role === "student" && (
          <button className="login-primary" onClick={() => submitQuiz(false)}>
            Submit Quiz
          </button>
        )}

        {submitError && (
          <p className="login-error">{submitError}</p>
        )}

        {(submitted || submitError) && (
          <h3 className="page-title" style={{ fontSize: 16 }}>
            Your Score: {score} / {quiz.questions.length}
          </h3>
        )}
      </div>
    </div>
  );
}

export default TakeQuiz;
