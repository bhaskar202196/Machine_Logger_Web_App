import React, { useState } from "react";

function CreateUser() {
  const [formData, setFormData] = useState({
    user_id: "",
    username: "",
    password: "",
    department: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Creating user...");

    try {
      const res = await fetch("http://localhost:3000/api/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(`✅ ${data.message}`);
        setFormData({
          user_id: "",
          username: "",
          password: "",
          department: "",
        });
      } else {
        let message = "";
        if (data.error.includes("user_map_user_id_key")) {
          message = "User ID Already Exists";
        }
        setStatus(`❌ Error: ${message}`);
      }
    } catch (err) {
      setStatus("⚠️ Could not connect to server.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Create New User</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="user_id"
          placeholder="User ID"
          value={formData.user_id}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Create User
        </button>
      </form>

      {status && <p style={styles.status}>{status}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "auto",
    padding: "2rem",
    fontFamily: "Arial",
  },
  heading: { textAlign: "center", color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: { padding: "0.8rem", borderRadius: "8px", border: "1px solid #ccc" },
  button: {
    padding: "0.8rem",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  status: { textAlign: "center", marginTop: "1rem", color: "#444" },
};

export default CreateUser;
