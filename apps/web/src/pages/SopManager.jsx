// src/pages/SopManager.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:3000/api";
const SOP_URL = `${BASE_URL}/sops`;

function SopManager({ userId }) {
  console.log("[SopManager] userId received from App.js:", userId);

  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [department, setDepartment] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [file, setFile] = useState(null);
  const [sops, setSops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedSop, setSelectedSop] = useState(null);
  const [hovering, setHovering] = useState(false);
  const [errorexists, seterrorexists] = useState(false);
  const [successmessage, setsuccessmessage] = useState(false);

  // ✅ Fetch machine list (for dropdown)
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const url = `${BASE_URL}/machines?email=${encodeURIComponent(
          userId
        )}&includeDept=true`;
        const { data } = await axios.get(url);

        console.log("[Machines API Raw Response]", data);

        // ✅ Extract machine list safely
        const list = data?.data?.list ?? [];
        console.log("[Processed machine list]", list);
        setMachines(list);
      } catch (err) {
        console.error("Machine fetch error:", err);
        setMachines([]);
      }
    };

    if (userId) fetchMachines();
  }, [userId]);

  // ✅ Auto-fill department when machine selected
  useEffect(() => {
    const found = machines.find((m) => m.machine_name === selectedMachine);
    setDepartment(found ? found.department : "");
  }, [selectedMachine, machines]);

  // ✅ Fetch SOP list
  const fetchSops = useCallback(async () => {
    try {
      const { data } = await axios.get(`${SOP_URL}/list`);
      setSops(data.Data || data.data || []);
    } catch (err) {
      console.error("SOP list fetch error:", err);
      setSops([]);
    }
  }, []);

  useEffect(() => {
    fetchSops();
  }, [fetchSops]);

  useEffect(() => {
    if (errorexists) {
      const timer = setTimeout(() => {
        seterrorexists(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorexists]);

  useEffect(() => {
    if (successmessage) {
      const timer = setTimeout(() => {
        setsuccessmessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successmessage]);

  // ✅ Upload Handler
  const handleUpload = async () => {
    if (!file || !selectedMachine) {
      seterrorexists(true);
      return;
    }

    const allowedExts = ["pdf", "docx"];
    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowedExts.includes(ext)) {
      alert(
        `❌ Invalid file type. Only ${allowedExts.join(
          ", "
        )} files are allowed.`
      );
      setFile(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      alert("❌ File too large. Maximum allowed size is 10 MB.");
      setFile(null);
      return;
    }
    setLoading(true);

    try {
      const body = {
        machine_name: selectedMachine,
        department,
        filename: file.name,
        ext: file.name.split(".").pop().toLowerCase(),
        uploaded_by: userId || "unknown@user",
      };

      // Step 1: Generate signed upload URL
      const { data: signRes } = await axios.post(
        `${SOP_URL}/sign-upload`,
        body
      );

      const payload = signRes.Data || signRes.data || signRes;
      const { uploadUrl, fileId } = payload;

      if (!uploadUrl || !fileId) {
        throw new Error("Upload URL or File ID missing from server response.");
      }

      // Step 2: Upload file to Supabase storage
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        transformRequest: [(data) => data],
      });

      // Step 3: Commit metadata entry in database
      await axios.post(`${SOP_URL}/commit`, { fileId });

      setsuccessmessage(true);
      setFile(null);
      setSelectedMachine("");
      setDepartment("");
      fetchSops(); // refresh list
    } catch (err) {
      console.error("SOP upload failed:", err);
      alert("❌ Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ File download
  const downloadById = React.useCallback(async (sopId, filename) => {
    try {
      const { data } = await axios.get(`${SOP_URL}/signed/${sopId}`);
      const downloadUrl =
        data?.Data?.downloadUrl || data?.data?.downloadUrl || null;

      if (!downloadUrl) {
        alert("Download link not available");
        return;
      }

      // Directly fetch the file blob and save
      const response = await axios.get(downloadUrl, { responseType: "blob" });
      saveAs(response.data, filename);
    } catch (err) {
      console.error("Download failed:", err);
      alert("❌ Failed to download file");
    }
  }, []);

  // Utility: create a proper Google Docs Viewer URL
  const getPreviewUrl = (url, ext) => {
    console.log("[getPreviewUrl] called with:", { url, ext });
    const supported = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"];
    if (supported.includes(ext?.toLowerCase())) {
      const viewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
        url
      )}`;
      console.log("[getPreviewUrl] returning viewer URL:", viewer);
      return viewer;
    }
    console.warn("[getPreviewUrl] Unsupported ext, returning original URL");
    return url;
  };

  // Handle Side Preview Pane
  const handlePreview = async (sop) => {
    try {
      const { data } = await axios.get(`${SOP_URL}/signed/${sop.id}`);
      const signedUrl = data?.Data?.downloadUrl;
      if (!signedUrl) throw new Error("No signed URL returned");

      // Generate Google Docs Viewer URL
      const previewUrl = getPreviewUrl(signedUrl, sop.ext);

      setSelectedSop({
        ...sop,
        previewUrl,
      });
      setPreviewOpen(true);
    } catch (err) {
      console.error("Preview fetch error", err);
      alert("Failed to load preview!");
    }
  };

  console.log("[machines state]", machines);

  // Handle Floating Buttons and Handlers
  const downloadSelected = React.useCallback(() => {
    if (!selectedSop?.previewUrl) return;
    saveAs(selectedSop.previewUrl, selectedSop.filename);
  }, [selectedSop]);

  const handleEdit = (sop) => {
    if (!sop?.id) {
      console.error("[handleEdit] Invalid SOP object:", sop);
      return; // exit only if invalid
    }

    console.log("[SopManager] Navigating to edit page for:", sop.id);
    navigate(`/sops/edit/${sop.id}`);
  };

  const handleReplace = () => {
    alert("Replace flow will be added next");
  };

  const handleRestore = async () => {
    try {
      await axios.post(`${SOP_URL}/restore/${selectedSop.id}`);
      alert("Previous version restored!");
      fetchSops();
    } catch (err) {
      console.error(err);
      alert("Restore failed!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-6">
      {/* 🔔 Error Popup */}
      {errorexists && (
        <div className="fixed top-5 right-5 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          Select machine and file first!
        </div>
      )}
      {successmessage && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          ✅ SOP uploaded successfully!
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">SOP Manager</h2>

      {/* Upload Panel */}
      <div className="bg-[#111827] p-4 rounded-xl shadow mb-6 w-[500px]">
        <h3 className="text-lg font-semibold mb-3">Upload New SOP</h3>

        <select
          className="w-full p-2 rounded mb-2 text-black"
          onChange={(e) => setSelectedMachine(e.target.value)}
          value={selectedMachine}
        >
          <option value="">Select Machine</option>
          {machines.map((m) => (
            <option key={m.machine_name} value={m.machine_name}>
              {m.machine_name}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="w-full p-2 rounded mb-2 text-black"
          value={department}
          placeholder="Department"
          readOnly
        />

        <input
          type="file"
          accept=".pdf,.docx"
          className="w-full mb-2"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded w-full disabled:opacity-50"
          disabled={loading}
          onClick={handleUpload}
        >
          {loading ? "Uploading..." : "Upload SOP"}
        </button>
      </div>

      {/* SOP List */}
      <h3 className="text-xl font-semibold mb-2">Existing SOPs</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-cyan-800">
            <th className="p-2">Machine</th>
            <th className="p-2">Department</th>
            <th className="p-2">Filename</th>
            <th className="p-2">Version</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sops.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center text-gray-400 p-3">
                No SOPs uploaded yet.
              </td>
            </tr>
          ) : (
            sops.map((sop) => (
              <tr
                key={sop.id}
                className="border-b border-cyan-900 hover:bg-[#1f2937] cursor-pointer"
                onClick={() => handlePreview(sop)}
              >
                <td className="p-2">{sop.machine_name}</td>
                <td className="p-2">{sop.department}</td>
                <td className="p-2">{sop.filename}</td>
                <td className="p-2">{sop.version}</td>
                <td className="p-2">
                  <button
                    className="bg-cyan-600 px-3 py-1 rounded mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadById(sop.id, sop.filename);
                    }}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Side Preview Drawer */}
      {previewOpen && selectedSop && (
        <div
          className="fixed top-0 right-0 w-[40%] h-full bg-[#111827] shadow-2xl p-4 transition-all"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold text-cyan-400">
              {selectedSop.filename}
            </h3>
            <button
              className="text-red-400 hover:text-red-600 text-lg"
              onClick={() => setPreviewOpen(false)}
            >
              ✖
            </button>
          </div>

          {/* Preview frame */}
          {!selectedSop.previewUrl ? (
            <div className="fixed top-0 right-0 w-[50%] h-full bg-[#111827] shadow-2xl p-4 overflow-y-auto transition-all">
              Loading preview...
            </div>
          ) : (
            <iframe
              src={selectedSop.previewUrl}
              className="w-full h-full rounded-lg"
              title="SOP Preview"
              frameBorder="0"
            ></iframe>
          )}

          {/* Floating Action Buttons */}
          <div
            className={`absolute bottom-6 right-8 flex flex-col gap-3 transition-opacity duration-500 ${
              hovering ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              onClick={downloadSelected}
              className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded shadow-md"
            >
              Download
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(selectedSop); // pass the full sop object
              }}
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded shadow-md"
            >
              Edit
            </button>
            <button
              onClick={handleReplace}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded shadow-md"
            >
              Replace
            </button>
            <button
              onClick={handleRestore}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded shadow-md"
            >
              Restore
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SopManager;
