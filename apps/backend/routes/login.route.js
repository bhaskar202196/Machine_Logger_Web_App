// apps/backend/routes/login.route.js
import express from "express";
const router = express.Router();
import { loginUser } from "../controllers/login.controller.js";

router.post("/login", loginUser);

export default router;
