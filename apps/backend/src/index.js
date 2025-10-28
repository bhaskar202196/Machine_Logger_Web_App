import express from "express";
import router from "../routes/login.route.js";
import dotenv from "dotenv";
dotenv.config();
import supabase from "../db/index.js";
import cors from "cors";
import apiroutes from "../routes/api.js";
import dashboardroutes from "../routes/dashboard.js";
import userrouter from "../routes/createuser.route.js";
import sopRoutes from "../routes/sop.route.js";

const app = express();
const corsoptions = {
  origin: ["http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(express.json());
app.use(cors(corsoptions));
app.use("/api", router);
app.use("/api", apiroutes);
app.use("/api", dashboardroutes);
app.use("/api/user", userrouter);
app.use("/api/sops", sopRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
