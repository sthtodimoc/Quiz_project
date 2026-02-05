import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import { getToken } from "../utils/auth";

function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(10);
  const [maxAttempts, setMaxAttempts] = useState(1);

  const navigate = useNavigate();

  async function submitQuiz() {
    if (!title.trim()) {
      return alert("Quiz title cannot be empty.");
    }

    if (timeLimit <= 0) {
      return alert("Time limit must be greater than 0.");
    }

    const res = await fetch("http://localhost:5000/quiz/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        title,
        timeLimit,
        maxAttempts,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.message || "Failed to create quiz.");
    }

    navigate(`/quiz/${data.quiz._id}/add-question`);
  }

  return (
    <div className="app-page">
      <div className="panel-card">
        <BackButton />
        <h2 className="page-title">Create a New Quiz</h2>
        <p className="page-subtitle">Set basic quiz settings</p>

        <label className="login-label">
          Quiz title
          <input
            className="input-dark"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="login-label">
          Time limit (minutes)
          <input
            className="input-dark"
            type="number"
            min="1"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
          />
        </label>

        <label className="login-label">
          Max attempts
          <input
            className="input-dark"
            type="number"
            min="1"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
          />
        </label>

        <button className="login-primary" onClick={submitQuiz}>
          Create Quiz
        </button>
      </div>
    </div>
  );
}

export default CreateQuiz;
