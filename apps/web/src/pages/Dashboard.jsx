import React from "react";
import TopMachinesChart from "../components/TopMachinesChart"; // Bar chart component
import TopMachinesRuntimeChart from "../components/TopMachinesRunTimeChart"; // ✅ fixed name casing

const Dashboard = () => {
  return (
    <div className="p-6 min-h-screen bg-gray-100">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Machine Usage Dashboard
      </h1>

      {/* Chart Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Machines by Run Count */}
        <TopMachinesChart />

        {/* Top Machines by Run Time */}
        <TopMachinesRuntimeChart />
      </div>

      {/* Future: Filters and detailed table will go below */}
    </div>
  );
};

export default Dashboard;
