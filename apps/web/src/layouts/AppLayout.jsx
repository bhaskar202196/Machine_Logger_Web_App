import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";

function AppLayout() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const userName = localStorage.getItem("name") || "User";
  const department = localStorage.getItem("department") || "";
  const initial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md z-40 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } flex flex-col justify-between`}
      >
        <div>
          <div className="p-4 border-b font-bold text-lg">Menu</div>
          <nav className="flex flex-col p-4 space-y-2">
            <Link to="/logger" onClick={() => setOpen(false)}>
              Machine Logger
            </Link>
            <Link to="/dashboard" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <Link to="/profile" onClick={() => setOpen(false)}>
              Profile
            </Link>
          </nav>
        </div>

        {/* Footer user profile */}
        <div className="relative border-t p-4">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
              {initial}
            </div>
            <div>
              <div className="font-semibold">{userName}</div>
              {department && (
                <div className="text-sm text-gray-500">{department}</div>
              )}
            </div>
          </div>

          {profileOpen && (
            <div className="absolute bottom-16 left-4 w-48 bg-white rounded shadow border z-50">
              <Link
                to="/profile"
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                onClick={() => setOpen(false)}
              >
                My Profile
              </Link>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
        ></div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="bg-blue-600 text-white p-4 flex items-center shadow">
          <button onClick={() => setOpen(true)} className="mr-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Lab Logger</h1>
        </header>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
