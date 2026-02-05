import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout } from "../utils/auth";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      logout();
      navigate("/login");
      return;
    }

    async function loadUsers() {
      try {
        const res = await fetch("http://localhost:5000/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load users");

        const data = await res.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadUsers();

    async function loadRoleRequests() {
      try {
        const res = await fetch(
          "http://localhost:5000/admin/role-requests",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to load role requests");

        const data = await res.json();
        setRoleRequests(data);
        setLoadingRequests(false);
      } catch (err) {
        setLoadingRequests(false);
      }
    }

    loadRoleRequests();
  }, [navigate]);

  async function updateRole(userId, role) {
    try {
      const res = await fetch(
        `http://localhost:5000/admin/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ role }),
        }
      );

      if (!res.ok) throw new Error("Failed to update role");

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role } : u))
      );
    } catch {
      alert("Failed to update role");
    }
  }

  async function reviewRoleRequest(userId, status) {
    try {
      const res = await fetch(
        `http://localhost:5000/admin/role-requests/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) throw new Error("Failed to update request");

      setRoleRequests((prev) =>
        prev.filter((r) => r.userId !== userId)
      );
    } catch {
      alert("Failed to update role request");
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container">{error}</div>;

  return (
    <div className="app-page">
      <div className="panel-card">
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="page-subtitle">Manage users and role requests</p>

        <div className="action-row">
          <button onClick={() => navigate("/quizzes")}>
            Quiz Management
          </button>
          <button className="dash-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="section">
          <h3 className="page-title" style={{ fontSize: 16 }}>
            Users
          </h3>
          <div className="glass-list">
            {users.map((user) => (
              <div key={user._id} className="glass-item">
                <strong>{user.email}</strong>
                <div style={{ marginTop: 8 }}>
                  Role:
                  <select
                    className="input-dark"
                    value={user.role}
                    onChange={(e) =>
                      updateRole(user._id, e.target.value)
                    }
                    style={{ marginTop: 6 }}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3 className="page-title" style={{ fontSize: 16 }}>
            Role Requests
          </h3>

          {loadingRequests && <p>Loading requests...</p>}

          {!loadingRequests && roleRequests.length === 0 && (
            <p className="muted">No pending requests.</p>
          )}

          <div className="glass-list">
            {roleRequests.map((req) => (
              <div key={req.userId} className="glass-item">
                <strong>{req.email}</strong>
                <div className="muted" style={{ marginTop: 6 }}>
                  Requested: {req.requestedRole}
                  {req.requestedAt &&
                    ` (${new Date(req.requestedAt).toLocaleString()})`}
                </div>
                <div className="action-row" style={{ marginTop: 8 }}>
                  <button onClick={() => reviewRoleRequest(req.userId, "approved")}>
                    Approve
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => reviewRoleRequest(req.userId, "denied")}
                  >
                    Deny
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

export default AdminDashboard;
