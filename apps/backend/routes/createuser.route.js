import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import supabase from "../db/index.js";

dotenv.config();

const userrouter = express.Router();

// POST /api/users/create
userrouter.post("/create", async (req, res) => {
  const { user_id, username, password, department } = req.body;

  if (!username || !user_id || !password) {
    return res
      .status(400)
      .json({ error: "Username, User_ID and Password are required." });
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert into Supabase
    const { data, error } = await supabase
      .from("user_map")
      .insert([{ user_id, username, password: hashedPassword, department }])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: "User created successfully!", data });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default userrouter;
