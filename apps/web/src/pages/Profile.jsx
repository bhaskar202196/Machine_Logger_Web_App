import React, { useState } from "react";

const API_URL = "http://localhost:3000";

const Profile = ({ currentUser }) => {
  const [formData, setFormData] = useState({
    userId: currentUser?.userId || "",
    username: currentUser?.username || "",
    department: currentUser?.department || "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const body = {
      action: "updateuser",
      userId: currentUser.userId, // existing userId
      newUserId: formData.userId,
      username: formData.username,
      department: formData.department,
    };

    console.log("Sending updateUser request:", body);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      console.log("updateUser response:", json);
      alert(json.message || "Update complete");
    } catch (err) {
      console.error("Error in updateUser:", err);
    }
  };

  const handlePasswordUpdate = async () => {
    const body = {
      action: "updatepassword",
      userId: currentUser.userId,
      newPassword,
    };

    console.log("Sending updatePassword request:", body);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      console.log("updatePassword response:", json);

      alert(json.message || "Password updated");
      setShowPasswordModal(false);
      setNewPassword("");
    } catch (err) {
      console.error("Error in updatePassword:", err);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* Profile form */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">User ID</label>
          <input
            type="text"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Save Changes
        </button>

        <button
          onClick={() => setShowPasswordModal(true)}
          className="ml-4 text-sm text-blue-600 hover:underline"
        >
          Change Password
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Update Password</h2>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full border-gray-300 rounded-md shadow-sm p-2 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordUpdate}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
