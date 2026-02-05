import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isLoggedIn, getUser } from "../utils/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ✅ Redirect already logged-in users by role
  useEffect(() => {
    if (isLoggedIn()) {
      const user = getUser();
      if (user?.role === "admin") navigate("/admin/dashboard");
      else if (user?.role === "teacher") navigate("/teacher/dashboard");
      else navigate("/quizzes");
    }
  }, [navigate]);

  async function handleLogin() {
    setError("");

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return setError(data.message || "Login failed");
      }

      // 🔐 Store auth
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 🚦 Role-based redirect
      if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (data.user.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/quizzes");
      }
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Welcome back</h2>
        <p className="login-subtitle">Sign in to continue</p>

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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button className="login-primary" onClick={handleLogin}>
          Log in
        </button>

        <p className="login-footer">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
