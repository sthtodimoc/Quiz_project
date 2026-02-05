import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout } from "../utils/auth";
import BackButton from "../components/BackButton";

function Notifications() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/notifications", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, [navigate]);

  function toggle(id) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  async function deleteSelected() {
    if (selected.length === 0) {
      return alert("No notifications selected");
    }

    try {
      await fetch("http://localhost:5000/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ids: selected }),
      });

      setItems((prev) =>
        prev.filter((n) => !selected.includes(n._id))
      );
      setSelected([]);
    } catch {
      alert("Failed to delete notifications");
    }
  }

  async function clearAll() {
    if (!window.confirm("Clear all notifications?")) return;

    try {
      await fetch("http://localhost:5000/notifications/clear/all", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setItems([]);
      setSelected([]);
    } catch {
      alert("Failed to clear notifications");
    }
  }

  return (
    <div className="app-page">
      <div className="panel-card">
        <BackButton />
        <h2 className="page-title">Notifications</h2>
        <p className="page-subtitle">Latest updates and alerts</p>

        {items.length > 0 && (
          <div className="action-row">
            <button onClick={deleteSelected}>Delete Selected</button>
            <button className="delete-btn" onClick={clearAll}>
              Clear All
            </button>
          </div>
        )}

        {items.length === 0 && (
          <p className="muted">No notifications.</p>
        )}

        <div className="glass-list">
          {items.map((n) => (
            <div key={n._id} className="glass-item">
              <label className="choice-row">
                <span>{n.message}</span>
                <input
                  type="checkbox"
                  checked={selected.includes(n._id)}
                  onChange={() => toggle(n._id)}
                />
              </label>
              <div className="muted">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
