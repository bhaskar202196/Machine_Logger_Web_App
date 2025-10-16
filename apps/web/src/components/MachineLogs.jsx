import React, { useEffect, useState } from "react";

// ✅ Updated API endpoint
const API_URL = "http://localhost:3000/api/alllogs";

const MachineLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(API_URL);
        const json = await response.json();
        console.log("✅ Logs from backend:", json.data);

        if (json.success && Array.isArray(json.data)) {
          setLogs(json.data);
        } else {
          console.error("API error:", json.error || "Unexpected response");
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Detailed Machine Logs
      </h1>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No logs available.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Timestamp
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Machine Name
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  User ID
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Start Time
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  End Time
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Total Run Time (mins)
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Department
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {logs.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {row.timestamp
                      ? new Date(row.timestamp).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {row.machine_name || "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {row.user_id || "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {row.start_time
                      ? new Date(row.start_time).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {row.end_time
                      ? new Date(row.end_time).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 text-right">
                    {row.total_run_time
                      ? parseFloat(row.total_run_time).toFixed(2)
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {row.department || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MachineLogs;
