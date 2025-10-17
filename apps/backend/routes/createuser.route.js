import express from "express";
import dotenv from "dotenv";
dotenv.config();
import supabase from "../db/index.js";

const userrouter = express.Router();

// POST /api/users/create
userrouter.post("/create", async (req, res) => {
  const { user_id, username, password, department } = req.body;

  if (!username || !user_id || !password) {
    return res
      .status(400)
      .json({ error: "Username, User_ID and Password are required." });
  }

  const { data, error } = await supabase
    .from("user_map")
    .insert([{ user_id, password, username, department }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: "User created successfully!", data });
});

export default userrouter;
