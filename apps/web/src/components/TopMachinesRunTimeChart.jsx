import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";

// ✅ New backend endpoint
const API_URL = "http://localhost:3000/api/topmachinesruntime";

// Utility: shorten long machine names for Y-axis labels
const truncateLabel = (label, maxLen = 22) => {
  if (!label) return "";
  return label.length > maxLen ? label.slice(0, maxLen) + "..." : label;
};

const TopMachinesRuntimeChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL);
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const formatted = json.data.map((item) => ({
            machine: item.machine,
            department: item.department,
            runTime: parseFloat(item.runTime), // numeric minutes
          }));
          setData(formatted);
        } else {
          console.error("API error:", json.error || "Unexpected response");
        }
      } catch (err) {
        console.error("Error fetching runtime data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Navigate to full logs page
  const handleViewMore = () => {
    navigate("/dashboard/logs");
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Top 5 Machines (Run Time)</h2>
        <button
          onClick={handleViewMore}
          className="text-sm text-blue-600 hover:underline"
        >
          View More
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading chart...</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              label={{
                value: "Run Time (mins)",
                position: "insideBottom",
                offset: 0,
                style: { fontSize: 12 },
              }}
            />
            <YAxis
              type="category"
              dataKey="machine"
              width={180}
              tickFormatter={(value) => truncateLabel(value)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name, props) => [
                `${value} mins`,
                `${props.payload.machine} (${props.payload.department})`,
              ]}
            />
            <Bar dataKey="runTime" fill="#FF8C42" name="Run Time" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopMachinesRuntimeChart;
