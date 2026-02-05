import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import BackButton from "./components/BackButton";
import { getToken } from "./utils/auth";

function AddQuestion() {
  const { quizId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [msg, setMsg] = useState("");

  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/quiz/${quizId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setQuiz({
          ...data,
          questions: Array.isArray(data.questions) ? data.questions : [],
        });
        setLoading(false);
      })
      .catch(() => {
        setMsg("Failed to load quiz.");
        setLoading(false);
      });
  }, [quizId]);

  async function submitQuestion() {
    setMsg("");

    if (!text.trim()) return setMsg("Question text cannot be empty.");
    if (options.some((opt) => !opt.trim()))
      return setMsg("All options must be filled.");

    const isEdit = editingIndex !== null;

    const url = isEdit
      ? `http://localhost:5000/quiz/${quizId}/question/${editingIndex}`
      : `http://localhost:5000/quiz/${quizId}/add-question`;

    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ text, options, correct }),
    });

    const data = await res.json();
    if (!res.ok) return setMsg(data.message || "Operation failed.");

    setQuiz({
      ...data.quiz,
      questions: data.quiz.questions || [],
    });

    setText("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    setEditingIndex(null);
    setMsg(isEdit ? "Question updated!" : "Question added!");
  }

  async function deleteQuestion(index) {
    if (!window.confirm("Delete this question?")) return;

    const res = await fetch(
      `http://localhost:5000/quiz/${quizId}/question/${index}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    const data = await res.json();
    if (!res.ok) return setMsg(data.message || "Failed to delete question.");

    setQuiz({
      ...data.quiz,
      questions: data.quiz.questions || [],
    });
  }

  function editQuestion(q, index) {
    setText(q.text);
    setOptions([...q.options]);
    setCorrect(q.correct);
    setEditingIndex(index);
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setText("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    setEditingIndex(null);
    setMsg("");
  }

  if (loading) return <div className="container">Loading quiz...</div>;
  if (!quiz) return <div className="container">Quiz not found.</div>;

  return (
    <div className="app-page">
      <div className="panel-card">
        <BackButton />

        <h2 className="page-title">
          {editingIndex !== null ? "Update Question" : "Add Question"}:{" "}
          {quiz.title}
        </h2>
        <p className="page-subtitle">Manage questions and answers</p>

        <label className="login-label">
          Question text
          <input
            className="input-dark"
            type="text"
            placeholder="Enter question"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <div className="section">
          <h3 className="page-title" style={{ fontSize: 16 }}>
            Options
          </h3>
          {options.map((opt, i) => (
            <input
              key={i}
              className="input-dark"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => {
                const copy = [...options];
                copy[i] = e.target.value;
                setOptions(copy);
              }}
              style={{ marginBottom: 8 }}
            />
          ))}
        </div>

        <label className="login-label">
          Correct Answer
          <select
            className="input-dark"
            value={correct}
            onChange={(e) => setCorrect(Number(e.target.value))}
          >
            {options.map((_, i) => (
              <option key={i} value={i}>
                Option {i + 1}
              </option>
            ))}
          </select>
        </label>

        <div className="action-row">
          <button onClick={submitQuestion}>
            {editingIndex !== null ? "Update Question" : "Add Question"}
          </button>

          {editingIndex !== null && (
            <button className="dash-ghost" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>

        {msg && <p className="muted">{msg}</p>}

        <div className="section">
          <h3 className="page-title" style={{ fontSize: 16 }}>
            Existing Questions
          </h3>
          {quiz.questions.length === 0 && (
            <p className="muted">No questions yet.</p>
          )}

          <div className="glass-list">
            {quiz.questions.map((q, index) => (
              <div key={index} className="glass-item">
                <strong>{q.text}</strong>
                <div className="action-row">
                  <button onClick={() => editQuestion(q, index)}>
                    Update
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteQuestion(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddQuestion;
