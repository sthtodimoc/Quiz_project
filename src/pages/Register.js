import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleRegister() {
    setError("");

    const res = await fetch("http://localhost:5000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return setError(data.message || "Registration failed");
    }

    navigate("/login");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Create an account</h2>
        <p className="login-subtitle">Join to start taking quizzes</p>

        {error && <p className="login-error">{error}</p>}

        <label className="login-label">
          Email
          <input
            className="login-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="login-label">
          <div className="login-label-row">
            <span>Password</span>
          </div>
          <input
            className="login-input"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button className="login-primary" onClick={handleRegister}>
          Create account
        </button>

        <p className="login-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
