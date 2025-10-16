import React, { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

// Utility: format timestamps nicely
const fmtDate = (ts) => {
  if (!ts) return "-";
  try {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return format(d, "yyyy-MM-dd HH:mm");
    }
  } catch (_) {}
  return String(ts).replace("T", " ").replace(/Z$/, "");
};

// ✅ New Express + Supabase API endpoint
const API_URL = "http://localhost:3000/api/alllogs";

// Helper to get start of time period for filters
const getStartOf = (type) => {
  const now = new Date();
  switch (type) {
    case "today":
      return new Date(now.setHours(0, 0, 0, 0));
    case "week": {
      const day = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
};

const MachineLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(10);

  // ✅ Fetch logs from backend API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(API_URL);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLogs(json.data);
        } else {
          console.error("API error:", json.error);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // ✅ Extract department list for filter dropdown
  const departments = useMemo(() => {
    const deptSet = new Set(
      logs.map((log) => log.department || log.Department).filter(Boolean)
    );
    return Array.from(deptSet);
  }, [logs]);

  // ✅ Apply filters (department, time period, search)
  useEffect(() => {
    let result = [...logs];

    if (departmentFilter) {
      result = result.filter(
        (log) => (log.department || log.Department) === departmentFilter
      );
    }

    if (durationFilter) {
      const startDate = getStartOf(durationFilter);
      if (startDate) {
        result = result.filter((log) => new Date(log.timestamp) >= startDate);
      }
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          (log.machine_name || "").toLowerCase().includes(term) ||
          (log.user_id || "").toLowerCase().includes(term)
      );
    }

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [logs, departmentFilter, durationFilter, searchTerm]);

  // ✅ Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  const start = filteredLogs.length ? indexOfFirstLog + 1 : 0;
  const end = Math.min(indexOfLastLog, filteredLogs.length);
  const total = filteredLogs.length;

  // ✅ Sorting
  const sortedLogs = useMemo(() => {
    return [...currentLogs].sort((a, b) => {
      const valA = a[sortKey] || "";
      const valB = b[sortKey] || "";
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [currentLogs, sortKey, sortDirection]);

  // ✅ Export to XLSX
  const handleDownload = () => {
    const exportData = filteredLogs.map((log) => ({
      Timestamp: fmtDate(log.timestamp),
      "Machine Name": log.machine_name || "-",
      "User ID": log.user_id || "-",
      "Start Time": fmtDate(log.start_time),
      "End Time": fmtDate(log.end_time),
      "Total Run Time": log.total_run_time
        ? `${parseFloat(log.total_run_time).toFixed(2)} mins`
        : "-",
      Department: log.department || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Machine Logs");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(file, "machine_logs.xlsx");
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Detailed Machine Logs
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search Machine or User ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />

        <select
          className="border px-3 py-2 rounded"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          className="border px-3 py-2 rounded"
          value={durationFilter}
          onChange={(e) => setDurationFilter(e.target.value)}
        >
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        <button
          onClick={handleDownload}
          className="ml-auto bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Download XLSX
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No logs available.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-[12px] uppercase tracking-wide text-gray-600">
                  {[
                    "Timestamp",
                    "Machine Name",
                    "User ID",
                    "Start Time",
                    "End Time",
                    "Total Run Time",
                    "Department",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 text-left border-b border-gray-200 cursor-pointer select-none"
                      onClick={() => {
                        const keyMap = {
                          Timestamp: "timestamp",
                          "Machine Name": "machine_name",
                          "User ID": "user_id",
                          "Start Time": "start_time",
                          "End Time": "end_time",
                          "Total Run Time": "total_run_time",
                          Department: "department",
                        };
                        const key = keyMap[header];
                        if (sortKey === key) {
                          setSortDirection((p) =>
                            p === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setSortKey(key);
                          setSortDirection("asc");
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header}
                        <span className="text-[10px]">
                          {sortKey ===
                            {
                              Timestamp: "timestamp",
                              "Machine Name": "machine_name",
                              "User ID": "user_id",
                              "Start Time": "start_time",
                              "End Time": "end_time",
                              "Total Run Time": "total_run_time",
                              Department: "department",
                            }[header] && (
                            <>
                              <span
                                className={
                                  sortDirection === "asc"
                                    ? "text-gray-800"
                                    : "text-gray-300"
                                }
                              >
                                ▲
                              </span>
                              <span
                                className={
                                  sortDirection === "desc"
                                    ? "text-gray-800"
                                    : "text-gray-300"
                                }
                              >
                                ▼
                              </span>
                            </>
                          )}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {sortedLogs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-800 whitespace-nowrap">
                      {fmtDate(row.timestamp)}
                    </td>
                    <td className="px-3 py-2 text-gray-800">
                      {row.machine_name || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-800">
                      {row.user_id || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-800 whitespace-nowrap">
                      {fmtDate(row.start_time)}
                    </td>
                    <td className="px-3 py-2 text-gray-800 whitespace-nowrap">
                      {fmtDate(row.end_time)}
                    </td>
                    <td className="px-3 py-2 text-gray-800 text-right">
                      {row.total_run_time
                        ? parseFloat(row.total_run_time).toFixed(2)
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-800">
                      {row.department || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 sm:px-6 py-2 border-t border-gray-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Rows per page</span>
              <select
                className="border rounded-md px-2 py-1.5 text-sm"
                value={logsPerPage}
                onChange={(e) => {
                  setLogsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {start}–{end} of {total}
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 grid place-items-center rounded-md border text-gray-700 disabled:opacity-40"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="h-8 w-8 grid place-items-center rounded-md border text-gray-700 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineLogs;
