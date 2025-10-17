// apps/backend/routes/login.route.js
import express from "express";
import supabase from "../db/index.js";
import jsonResponse from "../utils/response.js";
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json(jsonResponse(false, "Missing credentials"));
    }

    const { data, error } = await supabase
      .from("user_map")
      .select("user_id, password, username, department")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      console.error("[loginUser] supabase error:", error);
      return res.status(500).json(jsonResponse(false, "Auth error"));
    }

    if (!data) {
      return res.status(401).json(jsonResponse(false, "Invalid credentials"));
    }

    // TODO: If passwords are hashed, verify with bcrypt.compare(password, data.password)
    const isMatch = password === data.password; // TEMP ONLY — replace with bcrypt
    if (!isMatch) {
      return res.status(401).json(jsonResponse(false, "Invalid credentials"));
    }

    // Issue session/JWT if needed; for now return user profile
    const safeUser = {
      user_id: data.user_id,
      username: data.username,
      department: data.department,
    };

    return res.json(jsonResponse(true, safeUser));
  } catch (e) {
    console.error("[loginUser] exception:", e);
    return res.status(500).json(jsonResponse(false, "Server error"));
  }
});

export default router;
