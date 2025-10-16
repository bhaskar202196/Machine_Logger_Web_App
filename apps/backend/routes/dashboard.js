import express from "express";
import supabase from "../db/index.js";

const router = express.Router();
const jsonResponse = (res, obj) => res.json(obj);

// ✅ Top 5 machines by run count
router.get("/topmachines", async (req, res) => {
  try {
    const { data: logs } = await supabase
      .from("machine_logs")
      .select("machine_name");

    const counts = {};
    logs.forEach((l) => {
      if (l.machine_name)
        counts[l.machine_name] = (counts[l.machine_name] || 0) + 1;
    });

    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([machine, count]) => ({ machine, count }));

    return jsonResponse(res, { success: true, data: top });
  } catch (err) {
    return jsonResponse(res, { success: false, error: err.message });
  }
});

// ✅ Top machines with department
router.get("/topmachinesinfo", async (req, res) => {
  try {
    const { data: logs } = await supabase
      .from("machine_logs")
      .select("machine_name");
    const { data: machines } = await supabase.from("machines").select("*");

    const deptMap = {};
    machines.forEach(
      (m) => (deptMap[m.machine_name] = m.department || "Unknown")
    );

    const counts = {};
    logs.forEach((l) => {
      if (l.machine_name)
        counts[l.machine_name] = (counts[l.machine_name] || 0) + 1;
    });

    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([machine, count]) => ({
        machine,
        department: deptMap[machine] || "Unknown",
        count,
      }));

    return jsonResponse(res, { success: true, data: top });
  } catch (err) {
    return jsonResponse(res, { success: false, error: err.message });
  }
});

// ✅ All logs with department
router.get("/alllogs", async (req, res) => {
  try {
    const { data: logs } = await supabase.from("machine_logs").select("*");
    const { data: machines } = await supabase.from("machines").select("*");

    const deptMap = {};
    machines.forEach((m) => (deptMap[m.machine_name] = m.department));

    const formatted = logs.map((row) => ({
      ...row,
      department: deptMap[row.machine_name] || "N/A",
    }));

    return jsonResponse(res, { success: true, data: formatted });
  } catch (err) {
    return jsonResponse(res, { success: false, error: err.message });
  }
});

// ✅ Top machines by runtime
router.get("/topmachinesruntime", async (req, res) => {
  try {
    const { data: logs } = await supabase
      .from("machine_logs")
      .select("machine_name,total_run_time");
    const { data: machines } = await supabase.from("machines").select("*");

    const deptMap = {};
    machines.forEach(
      (m) => (deptMap[m.machine_name] = m.department || "Unknown")
    );

    const totals = {};
    logs.forEach((row) => {
      const name = row.machine_name;
      const mins = parseFloat(row.total_run_time) || 0;
      if (!totals[name])
        totals[name] = { totalMins: 0, department: deptMap[name] || "Unknown" };
      totals[name].totalMins += mins;
    });

    const top = Object.entries(totals)
      .sort((a, b) => b[1].totalMins - a[1].totalMins)
      .slice(0, 5)
      .map(([machine, info]) => ({
        machine,
        department: info.department,
        runTime: info.totalMins.toFixed(2) + " mins",
      }));

    return jsonResponse(res, { success: true, data: top });
  } catch (err) {
    return jsonResponse(res, { success: false, error: err.message });
  }
});

export default router;
