import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// Load environment variables
const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Validate presence
if (!url || !key) {
  console.warn(
    "[db] Missing SUPABASE_URL or key in env. Login routes will fail until set."
  );
}

// Create Supabase client
const supabase = createClient(url || "", key || "");

(async () => {
  try {
    const { data, error } = await supabase
      .from("machine_logs")
      .select("user_id")
      .limit(1);
    if (error) throw error;
    console.log("[db] Supabase client initialized successfully.");
  } catch (err) {
    console.error("[db] Supabase connection test failed:", err.message);
  }
})();

// Export the client
export default supabase;
