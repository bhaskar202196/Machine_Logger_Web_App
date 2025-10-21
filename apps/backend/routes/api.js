import express from "express";
import supabase from "../db/index.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// ---------- Utility JSON Response ----------
const jsonResponse = (res, obj) => res.json(obj);

// ✅ Get machines accessible by a user
router.get("/machines", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email)
      return jsonResponse(res, { success: false, message: "Missing email" });

    const { data: user } = await supabase
      .from("user_map")
      .select("*")
      .eq("user_id", email.trim().toLowerCase())
      .single();

    if (!user)
      return jsonResponse(res, { success: false, message: "User not found" });

    const deptRaw = user.department?.trim();
    if (!deptRaw)
      return jsonResponse(res, { success: false, data: { list: [] } });

    const { data: allMachines } = await supabase.from("machines").select("*");

    let list = [];
    if (deptRaw.toUpperCase() === "ALL") {
      list = allMachines.map((m) => m.machine_name);
    } else {
      const allowedDepts = deptRaw
        .split(",")
        .map((d) => d.trim().toUpperCase())
        .filter(Boolean);
      list = allMachines
        .filter((m) => allowedDepts.includes(m.department?.toUpperCase()))
        .map((m) => m.machine_name);
    }

    return jsonResponse(res, { success: true, data: { list } });
  } catch (err) {
    return jsonResponse(res, { success: false, error: err.message });
  }
});

// ✅ Start machine log
router.post("/start", async (req, res) => {
  try {
    const { machine, userId } = req.body;
    if (!machine || !userId)
      return jsonResponse(res, {
        success: false,
        message: "Machine or user not specified",
      });

    const now = new Date();

    const { error } = await supabase.from("machine_logs").insert([
      {
        timestamp: now,
        machine_name: machine,
        user_id: userId,
        start_time: now,
        end_time: null,
        total_run_time: null,
      },
    ]);

    if (error) throw error;
    return jsonResponse(res, { success: true });
  } catch (err) {
    return jsonResponse(res, { success: false, error: err.message });
  }
});

// ✅ Stop machine log
router.post("/stop", async (req, res) => {
  try {
    const { machine, userId } = req.body;
    if (!machine || !userId)
      return jsonResponse(res, {
        success: false,
        message: "Machine or user not specified",
      });

    const { data: rows, error } = await supabase
      .from("machine_logs")
      .select("*")
      .is("end_time", null)
      .eq("machine_name", machine)
      .eq("user_id", userId)
      .order("start_time", { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!rows || rows.length === 0)
      return jsonResponse(res, {
        success: false,
        message: "No matching start log found",
      });

    const now = new Date();
    const startTime = new Date(rows[0].start_time);
    const diffMs = Math.max(0, now - startTime);

    // ✅ convert to hh:mm:ss
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const formattedDuration = [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");

    // update the log record
    const { error: updateError } = await supabase
      .from("machine_logs")
      .update({
        end_time: now.toISOString(),
        total_run_time: formattedDuration, // ✅ hh:mm:ss
      })
      .eq("timestamp", rows[0].timestamp)
      .eq("machine_name", rows[0].machine_name)
      .eq("user_id", rows[0].user_id);

    if (updateError) throw updateError;

    return jsonResponse(res, {
      success: true,
      duration: formattedDuration,
      message: "Machine stopped successfully",
    });
  } catch (err) {
    console.error("❌ Stop error:", err);
    return jsonResponse(res, { success: false, error: err.message });
  }
});

// ✅ Custom Stop
router.post("/customStop", async (req, res) => {
  try {
    const { machine, userId, duration } = req.body;
    if (!machine || !userId || !duration)
      return jsonResponse(res, {
        success: false,
        message: "Missing parameters",
      });

    const { data: rows, error: selectError } = await supabase
      .from("machine_logs")
      .select("*")
      .is("end_time", null)
      .eq("machine_name", machine)
      .eq("user_id", userId)
      .order("start_time", { ascending: false })
      .limit(1);

    if (selectError) throw selectError;
    if (!rows || rows.length === 0)
      return jsonResponse(res, {
        success: false,
        message: "No matching start log found",
      });

    // ✅ Calculate end time and ensure duration formatted
    const startTime = new Date(rows[0].start_time);
    const endTime = new Date(); // Or you can parse customEnd if passed in body
    const formattedDuration = duration.includes(":")
      ? duration // already formatted
      : duration.toString(); // fallback

    const { error: updateError } = await supabase
      .from("machine_logs")
      .update({
        end_time: endTime.toISOString(),
        total_run_time: formattedDuration,
      })
      .eq("timestamp", rows[0].timestamp)
      .eq("machine_name", rows[0].machine_name)
      .eq("user_id", rows[0].user_id);

    if (updateError) throw updateError;

    return jsonResponse(res, {
      success: true,
      message: "Custom stop logged successfully",
      duration: formattedDuration,
    });
  } catch (err) {
    console.error("❌ Custom stop error:", err);
    return jsonResponse(res, { success: false, error: err.message });
  }
});

// ✅ Update password
router.post("/updatepassword", async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return jsonResponse(res, {
        success: false,
        error: "User ID and new password are required",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in Supabase
    const { error } = await supabase
      .from("user_map")
      .update({ password: hashedPassword })
      .eq("user_id", userId);

    if (error) throw error;

    return jsonResponse(res, {
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    return jsonResponse(res, { success: false, error: err.message });
  }
});

// ✅ Get user profile
router.get("/getuserprofile", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return jsonResponse(res, { success: false, message: "Missing userId" });

    const { data, error } = await supabase
      .from("user_map")
      .select("user_id, username, department")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    if (!data)
      return jsonResponse(res, { success: false, message: "User not found" });

    return jsonResponse(res, { success: true, data });
  } catch (err) {
    return jsonResponse(res, { success: false, error: err.message });
  }
});

export default router;
