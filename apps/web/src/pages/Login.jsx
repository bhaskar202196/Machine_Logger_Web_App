import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000/api/login";

function Login() {
  const [user_id, setuser_id] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (sessionStorage.getItem("userId")) {
      navigate("/logger", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, password }),
      });

      const data = await res.json();
      console.log("Login API response:", data);

      if (data.success) {
        // ✅ Use sessionStorage instead of localStorage
        sessionStorage.setItem("userId", user_id);
        sessionStorage.setItem("username", data.username || "User");
        sessionStorage.setItem("department", data.department || "");

        console.log("Session stored:", {
          userId: sessionStorage.getItem("userId"),
          name: sessionStorage.getItem("username"),
          dept: sessionStorage.getItem("department"),
        });

        // ✅ Tell App.js we’ve logged in
        window.onUserLogin?.();

        navigate("/logger", { replace: true });
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("Network or server error.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white p-8 rounded-2xl shadow-xl w-80"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">User ID</label>
          <input
            type="text"
            value={user_id}
            onChange={(e) => setuser_id(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg focus:outline-none"
            required
            autoComplete="username"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg focus:outline-none"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="mb-2 text-sm text-red-600 text-center">{error}</div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;
