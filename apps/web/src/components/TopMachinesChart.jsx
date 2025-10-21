import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";

// ✅ Backend base URL
const API_URL = "http://localhost:3000/api/topmachinesinfo";

const TopMachinesChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch top machine run counts (with departments)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL);
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const formattedData = json.data.map((item) => ({
            ...item,
            machineShort:
              item.machine.length > 25
                ? item.machine.slice(0, 25) + "..."
                : item.machine,
            fullName: item.machine,
          }));
          setData(formattedData);
        } else {
          console.error("API error:", json.error || "Unexpected response");
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Custom Tooltip with department info and full machine name
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { fullName, count, department } = payload[0].payload;
      return (
        <div className="bg-white border p-2 rounded shadow text-sm">
          <p className="font-semibold">{fullName}</p>
          <p>Run Count: {count}</p>
          {department && <p>Department: {department}</p>}
        </div>
      );
    }
    return null;
  };

  // ✅ Handle “View More” button
  const handleViewMore = () => {
    navigate("/dashboard/logs");
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Top 5 Machines (Run Count)</h2>
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
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              type="category"
              dataKey="machineShort"
              tick={{ fontSize: 12 }}
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="count" fill="#34d399" name="Run Count" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopMachinesChart;
