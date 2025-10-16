import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import RunLogger from "./pages/RunLogger";
import Dashboard from "./pages/Dashboard";
import MachineLogs from "./pages/MachineLogs";
import AppLayout from "./layouts/AppLayout";
import Profile from "./pages/Profile";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!sessionStorage.getItem("userId")
  );
  const [userId, setUserId] = useState(sessionStorage.getItem("userId"));

  // Mock current user until backend integration is ready
  const currentUser = {
    userId: userId || "bhaskar@lab",
    username: "Bhaskar",
    department: "ALL",
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const storedId = sessionStorage.getItem("userId");
      setIsLoggedIn(!!storedId);
      setUserId(storedId);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    window.onUserLogin = () => {
      const storedId = sessionStorage.getItem("userId");
      setIsLoggedIn(true);
      setUserId(storedId);
    };
    window.onUserLogout = () => {
      setIsLoggedIn(false);
      setUserId(null);
    };
    return () => {
      window.onUserLogin = null;
      window.onUserLogout = null;
    };
  }, []);

  return (
    <Routes>
      {/* Public login route */}
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/logger" replace /> : <Login />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={isLoggedIn ? <AppLayout /> : <Navigate to="/login" replace />}
      >
        <Route path="logger" element={<RunLogger userId={userId} />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard/logs" element={<MachineLogs />} />
        <Route path="profile" element={<Profile currentUser={currentUser} />} />

        {/* Redirect "/" to /logger when logged in */}
        <Route index element={<Navigate to="/logger" replace />} />
      </Route>

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
